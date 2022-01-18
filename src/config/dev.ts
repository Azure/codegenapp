import { RepoType, Sdk } from '../models/common';
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
            branch: 'main',
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
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-js',
            branch: 'main',
        },
        [Sdk.JavaSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-java',
            branch: 'main',
        },
        [Sdk.PythonSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineTestBot/azure-sdk-for-python',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: true,
    retries: 2,
    changeDatabase: true,
};
