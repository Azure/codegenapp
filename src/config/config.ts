import { RepoInfo } from '../models/CodeGenerationModel';
import { Env } from './environment';

/**
 * code gen service configuration properties.
 */
export interface Config {
    env: Env;
    enableHttps: boolean;
    httpPort: number;
    httpsPort: number;
    certKeyPath: string;
    certPemPath: string;
    ciphers: string;
    loggingConsoleLevel: string;
    loggingMaxFiles: number;
    loggingMaxFileSize: string;
    statsdHost: string;
    statsdPort: number;
    deploymentRegion: string;
    serviceName: string;
    defaultCodegenRepo: RepoInfo;
    defaultSwaggerRepo: RepoInfo;
    defaultSDKRepos: {
        [key: string]: RepoInfo;
    };
    armEndpoint: string;
    clientAuthEnabled: boolean;
    customers: Customer[];
    refreshClientCertificateIntervalSeconds: number;
    retries: number;
    healthProbeEndpoint: string;
    changeDatabase: boolean;
    // depthDatabase: {
    //     server: string;
    //     port: number;
    //     database: string;
    //     username: string;
    //     password: string;
    // };
    mongodb: {
        server: string;
        port: number;
        database: string;
        username: string;
        password: string;
    };
    githubToken: string;
}

export interface Customer {
    id: string;
    name: string;
    thumbprints: string[];
    authMetadataEndpoints: string[];
}
