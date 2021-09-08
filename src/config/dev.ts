import { RepoType, SDK } from '../models/common';
import { Config } from './config';
import { Env } from './environment';
import { LoggerLevel } from '../utils/logger/loggerLevel';

export const environmentConfigDev: Partial<Config> = {
    env: Env.Test,
    httpPort: 3000,
    httpsPort: 8443,
    enableHttps: false,
    certKeyPath: '.ssh/dev/server.key',
    certPemPath: '.ssh/dev/server.crt',
    loggingConsoleLevel: LoggerLevel.INFO,
    loggingMaxFiles: 20,
    loggingMaxFileSize: '200MB',
    serviceName: 'codegenappdev',
    defaultSwaggerRepo: {
        type: RepoType.GITHUB,
        path:
            'https://github.com/sdkautomationpipelinebot/azure-rest-api-specs',
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
                'https://github.com/sdkautomationpipelinebot/terraform-provider-azurerm',
            branch: 'pipeline',
        },
        [SDK.GO_SDK]: {
            type: RepoType.GITHUB,
            path:
                'https://github.com/sdkautomationpipelinebot/azure-sdk-for-go',
            branch: 'main',
        },
        [SDK.CLI_CORE_SDK]: {
            type: RepoType.GITHUB,
            path: 'https://github.com/sdkautomationpipelinebot/azure-cli',
            branch: 'dev',
        },
        [SDK.CLI_EXTENSTION_SDK]: {
            type: RepoType.GITHUB,
            path:
                'https://github.com/sdkautomationpipelinebot/azure-cli-extensions',
            branch: 'main',
        },
    },
    armEndpoint: 'https://management.azure.com',
    clientAuthEnabled: false,
    retries: 2,
};
