import { IRepoInfo, RepoInfo } from "../lib/CodeGenerationModel";
import { RepoType, SDK } from "../lib/common";
import { Config } from "./Config";

export const config: Config = {
  httpPort: 3000,
  loggingConsoleLevel: "info",
  loggingMaxFiles: 20,
  loggingMaxFileSize: "200MB",
  serviceEnvironment: "",
  serviceName: "codegenapp",
  statsdHost: "",
  statsdPort: 443,
  namespaceName: "",
  defaultSwaggerRepo: {
    type: RepoType.GITHUB,
    path: "https://github.com/Azure/azure-rest-api-specs",
    branch: "master",
  },
  database: {
    mongoConnectionString:
      "mongodb://sdkcodegen:g2MhYaEUT4CMDdw18BGbduTkjFUFXB69tX6xpCHFEzgkp8mZBuTFY8OdzvDJctBdpOQiSctmjmOyKahnkr2ZeA==@sdkcodegen.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@sdkcodegen@",
    mongoDbName: "openapiPlatform",
  },
};

export const default_codegen_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/Azure/depth-coverage-pipeline",
  branch: "main",
};

export const default_swagger_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/Azure/azure-rest-api-specs",
  branch: "master",
};

export const default_cli_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/Azure/azure-cli",
  branch: "dev",
};

export const default_terraform_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/microsoft/terraform-provider-azurerm",
  branch: "pipeline",
};

export let sdk_repos: Map<string, RepoInfo> = new Map<string, RepoInfo>();
sdk_repos[SDK.TF_SDK] = default_terraform_repo;
sdk_repos[SDK.CLI_CORE_SDK] = default_cli_repo;

export const default_dev_codegen_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/Azure/depth-coverage-pipeline",
  branch: "dev",
};

export const default_dev_swagger_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/chunyu3/azure-rest-api-specs",
  branch: "master",
};

export const default_dev_cli_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/chunyu3/azure-cli",
  branch: "dev",
};

export const default_dev_terraform_repo: RepoInfo = {
  type: RepoType.GITHUB,
  path: "https://github.com/chunyu3/terraform-provider-azurerm",
  branch: "pipeline",
};

export let sdk_dev_repos: Map<string, RepoInfo> = new Map<string, RepoInfo>();
sdk_dev_repos[SDK.TF_SDK] = default_dev_terraform_repo;
sdk_dev_repos[SDK.CLI_CORE_SDK] = default_dev_cli_repo;

export const getGitRepoInfo: IRepoInfo = (repoInfo) => {
  if (repoInfo === undefined || repoInfo === null)
    return { org: undefined, repo: undefined };
  const parts: string[] = repoInfo.path.split("/");
  const len = parts.length;
  if (len <= 2) return { org: undefined, repo: undefined };
  return { org: parts[len - 2], repo: parts[len - 1] };
};
