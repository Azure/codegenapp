import { RepoType, SDK } from '../models/common';
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
        path: 'https://github.com/AzureSDKPipelineBot/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/azure-sdk-pipeline',
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
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-go',
            branch: 'main',
        },
        [SDK.CLI_CORE_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-cli',
            branch: 'main',
        },
        [SDK.CLI_EXTENSION_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-cli-extensions',
            branch: 'main',
        },
        [SDK.DOTNET_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-net',
            branch: 'main',
        },
        [SDK.JS_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-js',
            branch: 'main',
        },
        [SDK.JAVA_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-java',
            branch: 'main',
        },
        [SDK.PYTHON_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelineBot/azure-sdk-for-python',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: true,
    retries: 2,
    changeDatabase: false,
};
