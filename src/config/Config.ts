import { RepoInfo } from "../lib/CodeGenerationModel";
import { RequiredConfiguration } from "../Logger/mongo/DbConnection";
import { Env } from "./environment";

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
  // serviceEnvironment: string;
  serviceName: string;
  // statsdHost: string;
  // statsdPort: number;
  // namespaceName: string;
  defaultCodegenRepo: RepoInfo;
  defaultSwaggerRepo: RepoInfo;
  defaultSDKRepos: {
    [key: string]: RepoInfo;
  };
  database: RequiredConfiguration;
  armEndpoint: string;
  clientAuthEnabled: boolean;
  customers: Customer[];
  refreshClientCertificateIntervalSeconds: number;
  retries: number;
  healthProbeEndpoint: string;
}

export interface Customer {
  id: string;
  name: string;
  thumbprints: string[];
  authMetadataEndpoints: string[];
}
