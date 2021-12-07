import { RepoType, Sdk } from '../models/common';
import { LoggerLevel } from '../utils/logger/loggerLevel';
import { Config } from './config';
import { Env } from './environment';

export const environmentConfigPpe: Partial<Config> = {
    env: Env.Preproduction,
    httpPort: 3000,
    httpsPort: 443,
    loggingConsoleLevel: LoggerLevel.INFO,
    loggingMaxFiles: 20,
    loggingMaxFileSize: '200MB',
    // serviceEnvironment: "",
    serviceName: 'codegenappdev',
    // statsdHost: "",
    // statsdPort: 443,
    // namespaceName: "",
    defaultSwaggerRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/AzureSDKPipelinePpeBot/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/AzureSDKPipelinePpeBot/azure-sdk-pipeline',
        branch: 'main',
    },
    defaultSDKRepos: {
        [Sdk.TfSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [Sdk.GoSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-sdk-for-go',
            branch: 'main',
        },
        [Sdk.CliCoreSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-cli',
            branch: 'dev',
        },
        [Sdk.CliExtensionSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-cli-extensions',
            branch: 'main',
        },
        [Sdk.DotNetSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-sdk-for-net',
            branch: 'main',
        },
        [Sdk.JsSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-sdk-for-net',
            branch: 'main',
        },
        [Sdk.JavaSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-sdk-for-net',
            branch: 'main',
        },
        [Sdk.PythonSdk]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/AzureSDKPipelinePpeBot/azure-sdk-for-net',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: true,
    retries: 2,
    changeDatabase: false,
};
