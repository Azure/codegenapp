import { RepoType, Sdk } from '../models/common';
import { LoggerLevel } from '../utils/logger/loggerLevel';
import { Config } from './config';
import { Env } from './environment';
import * as convict from 'convict';

export const configSchema = convict<Config>({
    env: {
        doc: 'The application environment.',
        format: [Env.Production, Env.Preproduction, Env.Development, Env.Test],
        default: Env.Development,
        env: 'NODE_ENV',
    },
    httpPort: {
        doc: 'Backend http port.',
        format: 'port',
        default: '3000',
        env: 'PORT',
    },
    httpsPort: {
        doc: 'Backend https port.',
        format: 'port',
        default: '443',
        env: 'HTTPSPORT',
    },
    enableHttps: {
        doc: 'Whether the server is https or not.',
        format: Boolean,
        default: true,
        env: 'sdkGenerationEnableHttps',
    },
    certKeyPath: {
        doc: 'The path to the key file.',
        format: String,
        default: '/secrets/certs_keys/cert_ssl.key',
        env: 'certKeyPath',
    },
    certPemPath: {
        doc: 'The path to the pem file.',
        format: String,
        default: '/secrets/certs_keys/cert_sslcrt.pem',
        env: 'certPemPath',
    },
    ciphers: {
        doc: 'The compliant ciphers to use and in the correct order.',
        format: String,
        default:
            'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256',
        env: 'ciphers',
    },
    loggingConsoleLevel: {
        doc: 'The log level.',
        format: [LoggerLevel.ERROR, LoggerLevel.WARN, LoggerLevel.INFO, LoggerLevel.DEBUG, LoggerLevel.VERBOSE],
        default: LoggerLevel.INFO,
    },
    loggingMaxFiles: {
        doc: 'The Max number of logging files.',
        format: Number,
        default: 20,
    },
    loggingMaxFileSize: {
        doc: 'The max size of an logging file.',
        format: String,
        default: '200MB',
    },
    statsdEnable: {
        doc: 'Whether enable statsd.',
        format: Boolean,
        default: true,
        env: 'statsdEnable',
    },
    statsdHost: {
        doc: 'The statsd host name.',
        format: String,
        default: 'geneva-services.geneva-monitoring',
        env: 'statsdHost',
    },
    statsdPort: {
        doc: 'The statsd port.',
        format: Number,
        default: 8125,
        env: 'statsdPort',
    },
    deploymentRegion: {
        doc: 'The region of this service deployed to',
        format: String,
        default: 'eastus',
        env: 'DEPLOYMENT_REGION',
    },
    serviceName: {
        doc: 'The service name.',
        format: String,
        default: 'sdk-generation',
    },
    defaultCodegenRepo: {
        type: {
            doc: 'The codegen repository type.',
            format: String,
            default: RepoType.GITHUB,
        },
        path: {
            doc: 'The url path of codegen repository.',
            format: String,
            default: 'https://github.com/Azure/azure-sdk-pipeline',
        },
        branch: {
            doc: 'The main branch of codegen repository.',
            format: String,
            default: 'dev',
        },
    },
    defaultSwaggerRepo: {
        type: {
            doc: 'The swagger repository type.',
            format: String,
            default: RepoType.GITHUB,
        },
        path: {
            doc: 'The url path of swagger repository.',
            format: String,
            default: 'https://github.com/AzureSDKPipelineBot/azure-rest-api-specs',
        },
        branch: {
            doc: 'The main branch of swagger repository.',
            format: String,
            default: 'main',
        },
    },
    defaultSDKRepos: {
        // doc: "The map of sdk repositories.[sdk]:[sdk repository configuration]",
        // format: (val)=>{/*noop */},
        // default: {}
        [Sdk.TfSdk]: {
            type: {
                doc: 'The terraform repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of terraform repository.',
                format: String,
                default: 'https://github.com/microsoft/terraform-provider-azurerm',
            },
            branch: {
                doc: 'The main branch of terraform repository.',
                format: String,
                default: 'pipeline',
            },
        },
        [Sdk.GoSdk]: {
            type: {
                doc: 'The go repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of go repository.',
                format: String,
                default: 'https://github.com/Azure/azure-sdk-for-go',
            },
            branch: {
                doc: 'The main branch of go repository.',
                format: String,
                default: 'main',
            },
        },
        [Sdk.CliCoreSdk]: {
            type: {
                doc: 'The clicore repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of clicore repository.',
                format: String,
                default: 'https://github.com/Azure/azure-cli',
            },
            branch: {
                doc: 'The main branch of clicore repository.',
                format: String,
                default: 'dev',
            },
        },
        [Sdk.CliExtensionSdk]: {
            type: {
                doc: 'The cliextension repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of cliextension repository.',
                format: String,
                default: 'https://github.com/Azure/azure-cli-extensions',
            },
            branch: {
                doc: 'The main branch of cliextension repository.',
                format: String,
                default: 'main',
            },
        },
        [Sdk.DotNetSdk]: {
            type: {
                doc: 'The dotnet repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of dotnet repository.',
                format: String,
                default: 'https://github.com/Azure/azure-sdk-for-net',
            },
            branch: {
                doc: 'The main branch of dotnet repository.',
                format: String,
                default: 'main',
            },
        },
        [Sdk.JsSdk]: {
            type: {
                doc: 'The js repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of js repository.',
                format: String,
                default: 'https://github.com/Azure/azure-sdk-for-js',
            },
            branch: {
                doc: 'The main branch of js repository.',
                format: String,
                default: 'main',
            },
        },
        [Sdk.JavaSdk]: {
            type: {
                doc: 'The java repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of java repository.',
                format: String,
                default: 'https://github.com/Azure/azure-sdk-for-net',
            },
            branch: {
                doc: 'The main branch of java repository.',
                format: String,
                default: 'main',
            },
        },
        [Sdk.PythonSdk]: {
            type: {
                doc: 'The python repository type.',
                format: String,
                default: RepoType.GITHUB,
            },
            path: {
                doc: 'The url path of python repository.',
                format: String,
                default: 'https://github.com/Azure/azure-sdk-for-net',
            },
            branch: {
                doc: 'The main branch of python repository.',
                format: String,
                default: 'main',
            },
        },
    },
    armEndpoint: {
        doc: 'The arm endpoint.',
        format: String,
        default: '',
        env: 'ARM_ENDPOINT_ENV',
    },
    clientAuthEnabled: {
        doc: 'Whether client auth is enabled.',
        format: Boolean,
        default: true,
        env: 'clientAuthEnabled',
    },
    customers: {
        doc: 'The customer auth info.',
        format: Array,
        default: [
            {
                name: 'openapiPortal',
                id: '0a1005c6-8089-4164-8d46-46fc28239500',
                thumbprints: ['B9EAFEF226F4C44C68684AC4348080AFECD1E4CC', '46BAB0A0212D6B32DBC627012274623B17A6FF2A', 'AE079CF9E902F7EEC3B2DBAE299237DD1A3C135C'],
                authMetadataEndpoints: [],
            },
            {
                name: 'managedApps',
                id: '41dc645f-94b2-4fb6-af3f-9c3ffe840749',
                thumbprints: [
                    '802529A056AB12B6948D7601BEED9F29740B87BE',
                    '6EC672ED6D767C6F9A2F3E5CAEED020553EC9DD1',
                    '6626BD95A03D62C94B09EB7122E956F03DA0418C',
                    '78C2E15B8285972D516464333D4C07F0B6B98DED',
                    '4061D3915BA5ADFBF942A74BFF4439188FF81404',
                    '6B6307604D7D2BF9E3D8DB5B92557D6890590F0A',
                ],
                authMetadataEndpoints: [],
            },
            {
                name: 'runners',
                id: '25c5363b-7fe5-4683-9363-4739fab8c1bb',
                thumbprints: ['B95A4E11225552D9C331694CAE0D833DF29B02DF', '4A79AB5164AD5D90C26A23A5479F232A210F6480'],
                authMetadataEndpoints: [],
            },
        ],
    },
    refreshClientCertificateIntervalSeconds: {
        doc: 'refresh client certificate interval seconds',
        format: Number,
        default: 60 * 60 * 2,
        env: 'REFRESH_CLIENT_CERTIFICATE_INTERVAL_SECONDS',
    },
    retries: {
        doc: 'The number of retries for a dependency.',
        format: Number,
        default: 6,
        env: 'retries',
    },
    changeDatabase: {
        doc: 'change the database based on entity',
        format: Boolean,
        default: false,
    },
    mongodb: {
        server: {
            doc: 'The host used to connect db',
            format: String,
            default: '',
            env: 'sdkGenerationMongoDbHost',
        },
        port: {
            doc: 'The port used to connect db',
            format: Number,
            default: 10225,
            env: 'sdkGenerationMongoDbPort',
        },
        database: {
            doc: 'The database used to connect db',
            format: String,
            default: '',
            env: 'sdkGenerationMongoDbDatabase',
        },
        username: {
            doc: 'The username used to connect db',
            format: String,
            default: '',
            env: 'sdkGenerationMongoDbUsername',
        },
        password: {
            doc: 'The password used to connect db',
            format: String,
            default: '',
            env: 'sdkGenerationMongoDbPassword',
        },
        ssl: {
            doc: 'Whether used ssl to connect db',
            format: Boolean,
            default: true,
            env: 'sdkGenerationMongoDbSsl',
        },
    },
    githubToken: {
        doc: 'The token used by github',
        format: String,
        default: '',
        env: 'sdkGenerationGithubToken',
    },
    azurePipelineToken: {
        doc: 'The token used to call azure pipeline',
        format: String,
        default: '',
        env: 'sdkGenerationAzurePipelineToken',
    },
    azurePipelineUrl: {
        doc: 'The url of azure pipeline',
        format: String,
        default: '',
        env: 'sdkGenerationAzurePipelineUrl',
    },
    azurePipelineRef: {
        doc: 'The azure pipeline ref name',
        format: String,
        default: 'main',
        env: 'sdkGenerationAzurePipelineRef',
    },
});
