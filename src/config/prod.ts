import { RepoType, Sdk } from '../models/common';
import { LoggerLevel } from '../utils/logger/loggerLevel';
import { Config } from './config';
import { Env } from './environment';

export const environmentConfigProd: Partial<Config> = {
    env: Env.Production,
    httpPort: 3000,
    httpsPort: 443,
    loggingConsoleLevel: LoggerLevel.INFO,
    loggingMaxFiles: 20,
    loggingMaxFileSize: '200MB',
    serviceName: 'sdk-generation',
    defaultSwaggerRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/azure-sdk-pipeline',
        branch: 'main',
    },
    defaultSDKRepos: {
        [Sdk.TfSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/microsoft/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [Sdk.GoSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-sdk-for-go',
            branch: 'main',
        },
        [Sdk.CliCoreSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-cli',
            branch: 'dev',
        },
        [Sdk.CliExtensionSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-cli-extensions',
            branch: 'main',
        },
        [Sdk.DotNetSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/Azure/azure-sdk-for-net',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: true,
    retries: 2,
    changeDatabase: false,
};
