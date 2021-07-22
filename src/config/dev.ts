import { RepoType, SDK } from "../lib/common";
import { Config } from "./Config";
import { Env } from "./environment";
import { LoggerLevel } from "./logger";

export const environmentConfigDev: Partial<Config> = {
  env: Env.Test,
  httpPort: 3000,
  httpsPort: 8443,
  enableHttps: true,
  certKeyPath: ".ssh/dev/server.key",
  certPemPath: ".ssh/dev/server.crt",
  loggingConsoleLevel: LoggerLevel.INFO,
  loggingMaxFiles: 20,
  loggingMaxFileSize: "200MB",
  // serviceEnvironment: "",
  serviceName: "codegenappdev",
  // statsdHost: "",
  // statsdPort: 443,
  // namespaceName: "",
  defaultSwaggerRepo: {
    type: RepoType.GITHUB,
    path: "https://github.com/chunyu3/azure-rest-api-specs",
    branch: "main",
  },
  defaultCodegenRepo: {
    type: RepoType.GITHUB,
    path: "https://github.com/Azure/depth-coverage-pipeline",
    branch: "dev",
  },
  defaultSDKRepos: {
    [SDK.TF_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/chunyu3/terraform-provider-azurerm",
      branch: "pipeline",
    },
    [SDK.GO_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/chunyu3/azure-sdk-for-go",
      branch: "main",
    },
    [SDK.CLI_CORE_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/chunyu3/azure-cli",
      branch: "dev",
    },
    [SDK.CLI_EXTENSTION_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/chunyu3/azure-cli-extensions",
      branch: "main",
    },
  },
  database: {
    mongoConnectionString:
      "mongodb://sdkcodegen:g2MhYaEUT4CMDdw18BGbduTkjFUFXB69tX6xpCHFEzgkp8mZBuTFY8OdzvDJctBdpOQiSctmjmOyKahnkr2ZeA==@sdkcodegen.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@sdkcodegen@",
    mongoDbName: "openapiPlatform",
  },
  armEndpoint: "https://management.azure.com",
  clientAuthEnabled: true,
  retries: 2,
};
