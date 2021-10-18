import { RepoType, SDK } from '../models/common';
import { LoggerLevel } from '../utils/logger/loggerLevel';
import { Config } from './config';
import { Env } from './environment';

export const environmentConfigTest: Partial<Config> = {
    env: Env.Test,
    httpPort: 3000,
    httpsPort: 443,
    enableHttps: true,
    loggingConsoleLevel: LoggerLevel.INFO,
    loggingMaxFiles: 20,
    loggingMaxFileSize: '200MB',
    defaultSwaggerRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/AzureSDKPipelineBot/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/azure-sdk-pipeline',
        branch: 'dev',
    },
    defaultSDKRepos: {
        [SDK.TF_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [SDK.GO_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-go',
            branch: 'main',
        },
        [SDK.CLI_CORE_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-cli',
            branch: 'dev',
        },
        [SDK.CLI_EXTENSTION_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-cli-extensions',
            branch: 'main',
        },
        [SDK.DOTNET_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-net',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: false,
    retries: 2,
    changeDatabase: true,
};
