import { RepoInfo } from "../lib/CodeGenerationModel";
import { RequiredConfiguration } from "../Logger/mongo/DbConnection";
import { Env } from "./environment";

/**
 * code gen service configuration properties.
 */
export interface Config {
  env: Env;
  httpPort: number;
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
  }
  database: RequiredConfiguration;
}
