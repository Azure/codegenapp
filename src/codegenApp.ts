import 'reflect-metadata';
import { Container } from 'inversify';
import * as express from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as bodyParser from 'body-parser';
import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import './controllers/depthConverageController';
import './controllers/codeGenerateController';
import { config } from './config';
import { InjectableTypes } from './injectableTypes/injectableTypes';
import { Config } from './config/config';
import { AuthUtils, CustomersThumbprints } from './utils/authUtils';
import { ENV } from './config/env';
import { Connection, createConnection } from 'typeorm';
import { CodeGenerationDao } from './dao/codeGenerationDao';
import { DepthCoverageDao } from './dao/depthCoverageDao';
import { TaskResultDao } from './dao/taskResultDao';
import { CodeGenerationService } from './services/codeGenerationService';
import { GithubDao } from './dao/githubDao';
import { stringify } from 'flatted';
import { DepthCoverageService } from './services/depthCoverageService';
import * as http from 'http';
import { Logger } from './utils/logger/Logger';
import { CodegenAppLogger } from './utils/logger/CodegenAppLogger';

class CodegenApp {
    private container: Container;
    private logger: Logger;
    private sqlServerCodegenConnection: Connection;
    private sqlServerDepthCoverageConnection: Connection;
    private mongoDbConnection: Connection;

    public async start(): Promise<void> {
        this.buildLogger();
        await this.init();
        await this.buildSqlServerConnection();
        await this.buildMongoDBCollection();
        this.buildContainer();
        await this.buildExpress();
        this.buildSchedulerTask();
    }

    private async init() {
        // load config from config.properties
        const fs = require('fs');
        if (fs.existsSync('src/config/credential.config.properties')) {
            const propertiesReader = require('properties-reader');
            const properties = propertiesReader(
                'src/config/credential.config.properties'
            );
            properties.each((key, value) => {
                process.env[key] = value;
            });
        }

        // load config from keyvault
        const credential = new ManagedIdentityCredential();
        const keyVaultUrl =
            process.env[ENV.ENV_KEYVAULT_URL] ||
            'https://codegencontrollerkv.vault.azure.net/';

        const client = new SecretClient(keyVaultUrl, credential);
        try {
            for await (let secretProperties of client.listPropertiesOfSecrets()) {
                this.logger.info('Secret properties: ', secretProperties);
                this.logger.info(secretProperties.name);
                const secret = await client.getSecret(secretProperties.name);
                process.env[secretProperties.name] = secret.value;
            }
        } catch (e) {
            this.logger.error('Failed to list key secrets');
            this.logger.error(e);
            this.logger.info('use the credential locally for test');
        }
    }

    private async buildSqlServerConnection() {
        this.sqlServerCodegenConnection = await createConnection({
            name: 'codegen',
            type: 'mssql',
            host: process.env[ENV.ENV_CODEGEN_DB_SERVER],
            port: parseInt(process.env[ENV.ENV_CODEGEN_DB_PORT]),
            username: process.env[ENV.ENV_CODEGEN_DB_USER],
            password: process.env[ENV.ENV_CODEGEN_DB_PASSWORD],
            database: process.env[ENV.ENV_CODEGEN_DATABASE],
            synchronize: true,
            logging: false,
            entities: [
                'dist/src/models/entity/codegenSqlServer/entity/**/*.js',
            ],
        });

        this.sqlServerDepthCoverageConnection = await createConnection({
            name: 'depthCoverage',
            type: 'mssql',
            host: process.env[ENV.ENV_DEPTH_DB_SERVER],
            port: parseInt(process.env[ENV.ENV_DEPTH_DB_PORT]),
            username: process.env[ENV.ENV_DEPTH_DB_USER],
            password: process.env[ENV.ENV_DEPTH_DB_PASSWORD],
            database: process.env[ENV.ENV_DEPTH_DATABASE],
            logging: false,
            entities: [
                'dist/src/models/entity/depthCoverageSqlServer/entity/**/*.js',
            ],
        });
    }

    private async buildMongoDBCollection() {
        this.mongoDbConnection = await createConnection({
            name: 'mongodb',
            type: 'mongodb',
            host: process.env[ENV.ENV_MONGO_DB_SERVER],
            port: parseInt(process.env[ENV.ENV_MONGO_DB_PORT]),
            username: process.env[ENV.ENV_MONGO_DB_USER],
            password: process.env[ENV.ENV_MONGO_DB_PASSWORD],
            database: process.env[ENV.ENV_MONGO_DB_DATABASE],
            ssl: true,
            synchronize: true,
            logging: true,
            entities: [
                'dist/src/models/entity/taskResultMongodb/entity/**/*.js',
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
            .bind<Connection>(InjectableTypes.CodegenSqlServerConnection)
            .toConstantValue(this.sqlServerCodegenConnection);
        this.container
            .bind<CodeGenerationService>(InjectableTypes.CodeGenerationService)
            .to(CodeGenerationService);
        this.container
            .bind<CodeGenerationDao>(InjectableTypes.CodeGenerationDao)
            .to(CodeGenerationDao);

        this.container
            .bind<Connection>(InjectableTypes.DepthCoverageSqlServerConnection)
            .toConstantValue(this.sqlServerDepthCoverageConnection);
        this.container
            .bind<DepthCoverageService>(InjectableTypes.DepthCoverageService)
            .to(DepthCoverageService);
        this.container
            .bind<DepthCoverageDao>(InjectableTypes.DepthCoverageDao)
            .to(DepthCoverageDao);

        this.container
            .bind<Connection>(InjectableTypes.MongoDbConnection)
            .toConstantValue(this.mongoDbConnection);
        this.container
            .bind<TaskResultDao>(InjectableTypes.TaskResultDao)
            .to(TaskResultDao);

        this.container.bind<GithubDao>(InjectableTypes.GithubDao).to(GithubDao);

        this.container.bind<AuthUtils>(InjectableTypes.AuthUtils).to(AuthUtils);
    }

    private async buildExpress(): Promise<void> {
        const errorHandler: express.ErrorRequestHandler = (
            err,
            req,
            res,
            next
        ) => {
            this.logger.error(`Exception was thrown during Request`, {
                request: req,
                error: err,
            });
            console.error(err);
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
                app.use(express.json());
                if (config.enableHttps && config.clientAuthEnabled) {
                    app.use((req, res, next) =>
                        this.container
                            .get<AuthUtils>(InjectableTypes.AuthUtils)
                            .ensureAuth(req, res, next, customerThumbprints)
                    );
                    setInterval(async () => {
                        try {
                            const latestCustomerThumbprints: CustomersThumbprints = await this.container
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
            res.send('welcome to codegen app service.');
        });

        const httpServer = http.createServer(serverInstance);
        let port = config.httpPort;
        if (config.enableHttps) {
            port = config.httpsPort || 8443;
        }
        httpServer.listen(port, () => {
            this.logger.info(`Listening http on port: ${config.httpPort}`);
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

        cron.schedule('* * * * *', function () {
            this.logger.info('running second task every minute');
        });
    }
}

new CodegenApp().start();
