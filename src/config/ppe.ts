import { RepoType, SDK } from '../models/common';
import { Config } from './config';
import { Env } from './environment';
import { LoggerLevel } from '../utils/logger/loggerLevel';

export const environmentConfigPpe: Partial<Config> = {
    env: Env.Preproduction,
    httpPort: 3000,
    httpsPort: 8443,
    certKeyPath: '.ssh/dev/server.key',
    certPemPath: '.ssh/dev/server.crt',
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
        path: 'https://github.com/AzureSDKPipelineBot/azure-rest-api-specs',
        branch: 'main',
    },
    defaultCodegenRepo: {
        type: RepoType.GITHUB,
        path: 'https://github.com/Azure/depth-coverage-pipeline',
        branch: 'dev',
    },
    defaultSDKRepos: {
        [SDK.TF_SDK]: {
            type: RepoType.GITHUB,
            path:
                'https://github.com/AzureSDKPipelineBot/terraform-provider-azurerm',
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
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: true,
    retries: 2,
    changeDatabase: false,
};
