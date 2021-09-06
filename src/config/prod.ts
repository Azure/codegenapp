import { RepoType, SDK } from "../lib/common";
import { Config } from "./Config";
import { Env } from "./environment";
import { LoggerLevel } from "./logger";

export const environmentConfigProd: Partial<Config> = {
  env: Env.Production,
  httpPort: 3000,
  httpsPort: 8443,
  certKeyPath: ".ssh/prod/server.key",
  certPemPath: ".ssh/prod/server.crt",
  loggingConsoleLevel: LoggerLevel.INFO,
  loggingMaxFiles: 20,
  loggingMaxFileSize: "200MB",
  // serviceEnvironment: "",
  serviceName: "codegenapp",
  // statsdHost: "",
  // statsdPort: 443,
  // namespaceName: "",
  defaultSwaggerRepo: {
    type: RepoType.GITHUB,
    path: "https://github.com/Azure/azure-rest-api-specs",
    branch: "main",
  },
  defaultCodegenRepo: {
    type: RepoType.GITHUB,
    path: "https://github.com/Azure/depth-coverage-pipeline",
    branch: "main",
  },
  defaultSDKRepos: {
    [SDK.TF_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/microsoft/terraform-provider-azurerm",
      branch: "pipeline",
    },
    [SDK.GO_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/Azure/azure-sdk-for-go",
      branch: "main",
    },
    [SDK.CLI_CORE_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/Azure/azure-cli",
      branch: "dev",
    },
    [SDK.CLI_EXTENSTION_SDK]: {
      type: RepoType.GITHUB,
      path: "https://github.com/Azure/azure-cli-extensions",
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
