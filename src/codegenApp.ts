import 'reflect-metadata';

import * as bodyParser from 'body-parser';
import * as express from 'express';
import { stringify } from 'flatted';
import * as fs from 'fs';
import * as http from 'http';
import { Server } from 'http';
import * as https from 'https';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Connection, createConnection } from 'typeorm';

import { config } from './config';
import { Config } from './config/config';
import './controllers/codeGenerateController';
import { CodeGenerationDao } from './dao/codeGenerationDao';
import { GithubDao } from './dao/githubDao';
import { TaskResultDao } from './dao/taskResultDao';
import { CodeGenerationDaoImpl } from './daoImpl/codeGenerationDaoImpl';
import { GithubDaoImpl } from './daoImpl/githubDaoImpl';
import { TaskResultDaoImpl } from './daoImpl/taskResultDaoImpl';
import { InjectableTypes } from './injectableTypes/injectableTypes';
import { CodeGenerationService } from './service/codeGenerationService';
import { CodeGenerationServiceImpl } from './servicesImpl/codeGenerationServiceImpl';
import { AuthUtils, CustomersThumbprints } from './utils/authUtils';
import { CodegenAppLogger } from './utils/logger/codegenAppLogger';
import { Logger } from './utils/logger/logger';
import { emitMetric, Metrics } from './utils/logger/telemetry';

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

    private async buildMongoDBCollection() {
        this.mongoDbConnection = await createConnection({
            name: 'mongodb',
            type: 'mongodb',
            host: config.mongodb.server,
            port: config.mongodb.port,
            username: config.mongodb.username,
            password: config.mongodb.password,
            database: config.mongodb.database,
            ssl: true,
            synchronize: config.changeDatabase,
            logging: true,
            entities: [
                'dist/src/models/entity/CodeGeneration.js',
                'dist/src/models/entity/TaskResult.js',
            ],
        });
    }

    private buildLogger(): void {
        this.logger = new CodegenAppLogger(config);
    }

    private buildContainer(): void {
        this.container = new Container();
        this.container
            .bind<Config>(InjectableTypes.Config)
            .toConstantValue(config);
        this.container
            .bind<Logger>(InjectableTypes.Logger)
            .toConstantValue(this.logger);

        this.container
            .bind<CodeGenerationService>(InjectableTypes.CodeGenerationService)
            .to(CodeGenerationServiceImpl);
        this.container
            .bind<CodeGenerationDao>(InjectableTypes.CodeGenerationDao)
            .to(CodeGenerationDaoImpl);

        this.container
            .bind<Connection>(InjectableTypes.MongoDbConnection)
            .toConstantValue(this.mongoDbConnection);
        this.container
            .bind<TaskResultDao>(InjectableTypes.TaskResultDao)
            .to(TaskResultDaoImpl);

        this.container
            .bind<GithubDao>(InjectableTypes.GithubDao)
            .to(GithubDaoImpl);

        this.container.bind<AuthUtils>(InjectableTypes.AuthUtils).to(AuthUtils);
    }

    private async buildExpress(): Promise<void> {
        const errorHandler: express.ErrorRequestHandler = (
            err,
            req,
            res,
            next
        ) => {
            this.logger.error(`Exception was thrown during Request`, err);
            res.status(500).send('Internal Server Error');
        };

        const customerThumbprints: CustomersThumbprints = await this.container
            .get<AuthUtils>(InjectableTypes.AuthUtils)
            .getCustomersThumbprints(config.customers);

        const server = new InversifyExpressServer(this.container);

        server
            .setConfig((app) => {
                app.use(
                    express.urlencoded({
                        extended: true,
                    })
                );
                app.use(
                    bodyParser.urlencoded({
                        extended: true,
                    })
                );
                app.use(bodyParser.json());

                app.use(
                    morgan(
                        function (tokens, req, res) {
                            const content = {
                                method: tokens.method(req, res),
                                path: tokens.url(req, res),
                                userAgent: tokens['user-agent'](req, res),
                                statusCode: tokens.status(req, res),
                                time: tokens['total-time'](req, res),
                            };
                            if (
                                content.path &&
                                content.path.includes('alive')
                            ) {
                                emitMetric(Metrics.LIVENESS, 1, content);
                            } else {
                                emitMetric(Metrics.API_CALLS, 1, content);
                            }
                            if (content.statusCode === 400) {
                                emitMetric(Metrics.BAD_REQUEST, 1, content);
                            } else if (content.statusCode === 404) {
                                emitMetric(Metrics.NOT_FOUND, 1, content);
                            } else if (content.statusCode === 500) {
                                emitMetric(
                                    Metrics.INTERNAL_SERVER_ERROR,
                                    1,
                                    content
                                );
                            } else {
                                emitMetric(Metrics.SUCCESS, 1, content);
                            }
                            return JSON.stringify(content);
                        },
                        {
                            stream: {
                                write: (message) => this.logger.info(message),
                            },
                        }
                    )
                );

                app.use(express.json());
                if (config.enableHttps && config.clientAuthEnabled) {
                    app.use((req, res, next) =>
                        this.container
                            .get<AuthUtils>(InjectableTypes.AuthUtils)
                            .ensureAuth(req, res, next, customerThumbprints)
                    );
                    setInterval(async () => {
                        try {
                            const latestCustomerThumbprints: CustomersThumbprints =
                                await this.container
                                    .get<AuthUtils>(InjectableTypes.AuthUtils)
                                    .getCustomersThumbprints(config.customers);
                            for (const [key, value] of Object.entries(
                                latestCustomerThumbprints
                            )) {
                                if (customerThumbprints[key]) {
                                    customerThumbprints[key] = value;
                                }
                            }
                            this.logger.info(
                                `Refresh client certificate successfully.`
                            );
                        } catch (e) {
                            this.logger.error(
                                `Refresh client certificate failed. message:${e.message}`
                            );
                        }
                    }, config.refreshClientCertificateIntervalSeconds * 1000);
                }
            })
            .setErrorConfig((app) => {
                app.use(errorHandler);
            });
        const serverInstance = server.build();
        serverInstance.get('/', function (req, res) {
            res.send('welcome to sdk generation service.');
            res.status(200);
        });
        serverInstance.get('/alive', function (req, res) {
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
                serverInstance
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
        const cron = require('node-cron');
        /*auto complete code generation. */
        const codeGenerationService = this.container.get<CodeGenerationService>(
            InjectableTypes.CodeGenerationService
        );
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

new CodegenApp().start();
