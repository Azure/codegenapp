import { RepoInfo } from "../lib/CodeGenerationModel";
import { RequiredConfiguration } from "../Logger/mongo/DbConnection";

/**
 * code gen service configuration properties.
 */
export interface Config {
  httpPort: number;
  loggingConsoleLevel: string;
  loggingMaxFiles: number;
  loggingMaxFileSize: string;
  serviceEnvironment: string;
  serviceName: string;
  statsdHost: string;
  statsdPort: number;
  namespaceName: string;
  defaultSwaggerRepo: RepoInfo;
  database: RequiredConfiguration;
}
