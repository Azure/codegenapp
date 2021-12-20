import { RepoType, SDK } from '../models/common';
import { LoggerLevel } from '../utils/logger/loggerLevel';
import { Config } from './config';
import { Env } from './environment';

export const environmentConfigDev: Partial<Config> = {
    env: Env.Development,
    httpPort: 3000,
    httpsPort: 443,
    enableHttps: false,
    loggingConsoleLevel: LoggerLevel.INFO,
    loggingMaxFiles: 20,
    loggingMaxFileSize: '200MB',
    defaultSwaggerRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/AzureSDKPipelineTestBot/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-pipeline',
        branch: 'dev',
    },
    defaultSDKRepos: {
        [SDK.TF_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [SDK.GO_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-go',
            branch: 'main',
        },
        [SDK.CLI_CORE_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-cli',
            branch: 'dev',
        },
        [SDK.CLI_EXTENSION_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-cli-extensions',
            branch: 'main',
        },
        [SDK.DOTNET_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-net',
            branch: 'main',
        },
        [SDK.JS_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-js',
            branch: 'main',
        },
        [SDK.JAVA_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-java',
            branch: 'main',
        },
        [SDK.PYTHON_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-python',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: false,
    retries: 2,
    changeDatabase: true,
};
