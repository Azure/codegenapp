import { RepoType, SDK } from '../models/common';
import { Config } from './config';
import { Env } from './environment';
import { LoggerLevel } from '../utils/logger/loggerLevel';

export const environmentConfigProd: Partial<Config> = {
    env: Env.Production,
    httpPort: 3000,
    httpsPort: 8443,
    certKeyPath: '.ssh/prod/server.key',
    certPemPath: '.ssh/prod/server.crt',
    loggingConsoleLevel: LoggerLevel.INFO,
    loggingMaxFiles: 20,
    loggingMaxFileSize: '200MB',
    // serviceEnvironment: "",
    serviceName: 'codegenapp',
    // statsdHost: "",
    // statsdPort: 443,
    // namespaceName: "",
    defaultSwaggerRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/depth-coverage-pipeline',
        branch: 'main',
    },
    defaultSDKRepos: {
        [SDK.TF_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/microsoft/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [SDK.GO_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-sdk-for-go',
            branch: 'main',
        },
        [SDK.CLI_CORE_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-cli',
            branch: 'dev',
        },
        [SDK.CLI_EXTENSTION_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-cli-extensions',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: true,
    retries: 2,
};
