import { RepoType, Sdk } from '../models/common';
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
        path: 'https://github.com/AzureSDKPipelineTestBot/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-pipeline',
        branch: 'main',
    },
    defaultSDKRepos: {
        [Sdk.TfSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [Sdk.GoSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-go',
            branch: 'main',
        },
        [Sdk.CliCoreSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-cli',
            branch: 'dev',
        },
        [Sdk.CliExtensionSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-cli-extensions',
            branch: 'main',
        },
        [Sdk.DotNetSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-net',
            branch: 'main',
        },
        [Sdk.JsSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-net',
            branch: 'main',
        },
        [Sdk.JavaSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-net',
            branch: 'main',
        },
        [Sdk.PythonSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-net',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: false,
    retries: 2,
    changeDatabase: true,
};
