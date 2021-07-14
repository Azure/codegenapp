import * as convict from "convict";
import { RepoType, SDK } from "../lib/common";
import { Config } from "./Config";
import { Env } from "./environment";
import { LoggerLevel } from "./logger";

export const configSchema = convict<Config>({
    env: {
        doc: "The application environment.",
        format: [Env.Production, Env.Preproduction, Env.Development, Env.Test],
        default: Env.Development,
        env: "NODE_ENV",
    },
    httpPort: {
        doc: "Backend port.",
        format: "port",
        default: "3000",
        env: "PORT",
    },
  loggingConsoleLevel: {
      doc: "The log level.",
      format: [LoggerLevel.ERROR, LoggerLevel.WARN, LoggerLevel.INFO, LoggerLevel.DEBUG, LoggerLevel.VERBOSE],
      default: LoggerLevel.INFO
  },
  loggingMaxFiles: {
      doc: "The Max number of logging files.",
      format: Number,
      default: 20
  },
  loggingMaxFileSize: {
      doc: "The max size of an logging file.",
      format: String,
      default: "200MB"
  },
  serviceName: {
      doc: "The service name.",
      format: String,
      default: "codegenappdev"
  },
  defaultCodegenRepo: {
    type: {
        doc: "The codegen repository type.",
        format: String,
        default: RepoType.GITHUB,
    },
    path: {
        doc: "The url path of codegen repository.",
        format: String,
        default: "https://github.com/Azure/depth-coverage-pipeline",
    },
    branch: {
        doc: "The main branch of codegen repository.",
        format: String,
        default: "dev",
    }
  },
  defaultSwaggerRepo: {
    type: {
        doc: "The swagger repository type.",
        format: String,
        default: RepoType.GITHUB,
    },
    path: {
        doc: "The url path of swagger repository.",
        format: String,
        default: "https://github.com/chunyu3/azure-rest-api-specs",
    },
    branch: {
        doc: "The main branch of swagger repository.",
        format: String,
        default: "master",
    }
  },
  defaultSDKRepos: {
    // doc: "The map of sdk repositories.[sdk]:[sdk repository configuration]",
    // format: (val)=>{/*noop */},
    // default: {}
    [SDK.TF_SDK]: {
        type: {
            doc: "The terraform repository type.",
            format: String,
            default: RepoType.GITHUB,
        },
        path: {
            doc: "The url path of terraform repository.",
            format: String,
            default: "https://github.com/chunyu3/terraform-provider-azurerm",
        },
        branch: {
            doc: "The main branch of terraform repository.",
            format: String,
            default: "pipeline",
        }
    },
    [SDK.GO_SDK]: {
        type: {
            doc: "The go repository type.",
            format: String,
            default: RepoType.GITHUB,
        },
        path: {
            doc: "The url path of go repository.",
            format: String,
            default: "https://github.com/chunyu3/azure-sdk-for-go",
        },
        branch: {
            doc: "The main branch of go repository.",
            format: String,
            default: "main",
        }
    },
    [SDK.CLI_CORE_SDK]: {
        type: {
            doc: "The clicore repository type.",
            format: String,
            default: RepoType.GITHUB,
        },
        path: {
            doc: "The url path of clicore repository.",
            format: String,
            default: "https://github.com/chunyu3/azure-cli",
        },
        branch: {
            doc: "The main branch of clicore repository.",
            format: String,
            default: "dev",
        }
    },
    [SDK.CLI_EXTENSTION_SDK]: {
        type: {
            doc: "The cliextension repository type.",
            format: String,
            default: RepoType.GITHUB,
        },
        path: {
            doc: "The url path of cliextension repository.",
            format: String,
            default: "https://github.com/chunyu3/azure-cli-extensions",
        },
        branch: {
            doc: "The main branch of cliextension repository.",
            format: String,
            default: "main",
        }
      }

  },
  database: {
    mongoConnectionString: {
        doc: "The mongo db connection string.",
        format: String,
        default: "mongodb://sdkcodegen:g2MhYaEUT4CMDdw18BGbduTkjFUFXB69tX6xpCHFEzgkp8mZBuTFY8OdzvDJctBdpOQiSctmjmOyKahnkr2ZeA==@sdkcodegen.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@sdkcodegen@",
    },
    mongoDbName: {
        doc: "The mongo database name.",
        format: String,
        default: "openapiPlatform",
    }
  }
});