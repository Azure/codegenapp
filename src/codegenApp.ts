import { config } from './config';
import { Config } from './config/config';
import './controllers/codeGenerateController';
import { CodeGenerationDao } from './dao/codeGenerationDao';
import { GithubDao } from './dao/githubDao';
import { TaskResultDao } from './dao/taskResultDao';
import { CodeGenerationDaoImpl } from './daoImpl/codeGenerationDaoImpl';
import { GithubDaoImpl } from './daoImpl/githubDaoImpl';
import { TaskResultDaoImpl } from './daoImpl/taskResultDaoImpl';
import { injectableTypes } from './injectableTypes/injectableTypes';
import { CodeGeneration } from './models/entity/CodeGeneration';
import { TaskResult } from './models/entity/TaskResult';
import { CodeGenerationService } from './service/codeGenerationService';
import { CodeGenerationServiceImpl } from './servicesImpl/codeGenerationServiceImpl';
import { AuthUtils, CustomersThumbprints } from './utils/authUtils';
import { CodegenAppLogger } from './utils/logger/codegenAppLogger';
import { Logger } from './utils/logger/logger';
import { emitMetric, Metrics } from './utils/logger/telemetry';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import { Server } from 'http';
import * as https from 'https';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const morgan = require('morgan');

class CodegenApp {
    private container: Container;
    private logger: Logger;
    private mongoDbConnection: Connection;

    public async start(): Promise<void> {
        this.buildLogger();
        await this.buildMongoDBCollection();
        this.buildContainer();
        await this.buildExpress();
        this.buildSchedulerTask();
    }

    public async shutdown(): Promise<void> {
        await this.mongoDbConnection.close();
    }

    private async buildMongoDBCollection() {
        this.mongoDbConnection = await createConnection({
            name: 'mongodb',
            type: 'mongodb',
            host: config.mongodb.server,
            port: config.mongodb.port,
            username: config.mongodb.username,
            password: config.mongodb.password,
            database: config.mongodb.database,
            ssl: config.mongodb.ssl,
            synchronize: config.changeDatabase,
            logging: true,
            entities: [CodeGeneration, TaskResult],
        });
    }

    private buildLogger(): void {
        this.logger = new CodegenAppLogger(config);
    }

    private buildContainer(): void {
        this.container = new Container();
        this.container.bind<Config>(injectableTypes.Config).toConstantValue(config);
        this.container.bind<Logger>(injectableTypes.Logger).toConstantValue(this.logger);

        this.container.bind<CodeGenerationService>(injectableTypes.CodeGenerationService).to(CodeGenerationServiceImpl);
        this.container.bind<CodeGenerationDao>(injectableTypes.CodeGenerationDao).to(CodeGenerationDaoImpl);

        this.container.bind<Connection>(injectableTypes.MongoDbConnection).toConstantValue(this.mongoDbConnection);
        this.container.bind<TaskResultDao>(injectableTypes.TaskResultDao).to(TaskResultDaoImpl);

        this.container.bind<GithubDao>(injectableTypes.GithubDao).to(GithubDaoImpl);

        this.container.bind<AuthUtils>(injectableTypes.AuthUtils).to(AuthUtils);
    }

    private async buildExpress(): Promise<void> {
        const errorHandler: express.ErrorRequestHandler = (err, req, res, _) => {
            this.logger.error(`Exception was thrown during Request`, err);
            res.status(500).send('Internal Server Error');
        };

        const customerThumbprints: CustomersThumbprints = await this.container.get<AuthUtils>(injectableTypes.AuthUtils).getCustomersThumbprints(config.customers);

        const server = new InversifyExpressServer(this.container);

        server
            .setConfig((app) => {
                app.use(
                    express.urlencoded({
                        extended: true,
                    }),
                );
                app.use(
                    bodyParser.urlencoded({
                        extended: true,
                    }),
                );
                app.use(bodyParser.json());

                app.use(
                    morgan(
                        (tokens, req, res) => {
                            const content = {
                                method: tokens.method(req, res),
                                path: tokens.url(req, res),
                                userAgent: tokens['user-agent'](req, res),
                                statusCode: tokens.status(req, res),
                                time: tokens['total-time'](req, res),
                            };
                            if (content.path && content.path.includes('alive')) {
                                emitMetric(Metrics.Liveness, 1, content);
                            } else {
                                emitMetric(Metrics.ApiCalls, 1, content);
                            }
                            if (content.statusCode === 400) {
                                emitMetric(Metrics.BadRequest, 1, content);
                            } else if (content.statusCode === 404) {
                                emitMetric(Metrics.NotFound, 1, content);
                            } else if (content.statusCode === 500) {
                                emitMetric(Metrics.InternalServerError, 1, content);
                            } else {
                                emitMetric(Metrics.Success, 1, content);
                            }
                            return JSON.stringify(content);
                        },
                        {
                            stream: {
                                write: (message) => this.logger.info(message),
                            },
                        },
                    ),
                );

                app.use(express.json());
                if (config.enableHttps && config.clientAuthEnabled) {
                    app.use((req, res, next) => this.container.get<AuthUtils>(injectableTypes.AuthUtils).ensureAuth(req, res, next, customerThumbprints));
                    setInterval(async () => {
                        try {
                            const latestCustomerThumbprints: CustomersThumbprints = await this.container
                                .get<AuthUtils>(injectableTypes.AuthUtils)
                                .getCustomersThumbprints(config.customers);
                            for (const [key, value] of Object.entries(latestCustomerThumbprints)) {
                                if (customerThumbprints[key]) {
                                    customerThumbprints[key] = value;
                                }
                            }
                            this.logger.info(`Refresh client certificate successfully.`);
                        } catch (e) {
                            this.logger.error(`Refresh client certificate failed. message:${e.message}`);
                        }
                    }, config.refreshClientCertificateIntervalSeconds * 1000);
                }
            })
            .setErrorConfig((app) => {
                app.use(errorHandler);
            });
        const serverInstance = server.build();
        serverInstance.get('/', (req, res) => {
            res.send('welcome to sdk generation service.');
            res.status(200);
        });
        serverInstance.get('/alive', (req, res) => {
            res.send('alive');
            res.status(200);
        });

        let webServer: Server;
        let port: number;
        if (config.enableHttps) {
            webServer = https.createServer(
                {
                    key: fs.readFileSync(config.certKeyPath),
                    cert: fs.readFileSync(config.certPemPath),
                    requestCert: true,
                    rejectUnauthorized: false,
                },
                serverInstance,
            );
            port = config.httpsPort;
        } else {
            webServer = http.createServer(serverInstance);
            port = config.httpPort;
        }
        webServer.listen(port, () => {
            this.logger.info(`Listening http on port: ${port}`);
        });
    }

    private buildSchedulerTask() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const cron = require('node-cron');
        /*auto complete code generation. */
        const codeGenerationService = this.container.get<CodeGenerationService>(injectableTypes.CodeGenerationService);
        cron.schedule('* * * * *', function () {
            this.logger.info('running auto-complete task every minute');
            codeGenerationService.completeAllCodeGenerations();
        });
        /* CI code generation schedule-trigger. */
        cron.schedule('5 1 * * 0', function () {
            this.logger.info('running CI task every week');
            codeGenerationService.runCodeGenerationForCI();
        });
    }
}

export const codegenAppClient = new CodegenApp();
