import fs = require("fs");
import csv = require("csv-parser");
import { RepoInfo } from "./CodeGenerationModel";
var parse = require("csv-parse/lib/sync");
export enum REPO {
  SWAGGER_REPO = "azure-rest-api-specs",
  TF_PROVIDER_REPO = "terraform-provider-azurerm",
  CLI_REPO = "azure-cli",
  CLI_EXTENSION_REPO = "azure-cli-extensions",
  DEPTH_COVERAGE_REPO = "depth-coverage-pipeline",
}

export enum ORG {
  AZURE = "Azure",
  MS = "microsoft",
}

export enum SDK {
  TF_SDK = "terraform",
  CLI_CORE_SDK = "clicore",
  CLI_EXTENSTION_SDK = "cliextension",
  GO_SDK = "go",
  DOTNET_SDK = "dotnet",
}

export enum README {
  TF_README_FILE = "readme.terraform.md",
  CLI_README_FILE = "readme.az.md",
}

export enum CodeGenerationType {
  DEPTH_COVERAGE = "depth",
  CI = "CI",
  ADHOC = "ad-hoc",
  RELEASE = "release",
  DEV_ONBOARD = "dev",
}
export enum OnboardType {
  DEPTH_COVERAGE = "depth",
  CI = "CI",
  ADHOC = "ad-hoc",
  RELEASE = "release",
  DEV_ONBOARD = "dev",
}

export enum AutorestSDK {
  AUTOREST_SDK_TF = "terraform",
  AUTOREST_SDK_CLI_CORE = "clicore",
  AUTOREST_SDK_CLI_EXTENSION = "cliextension",
}

export enum RepoType {
  GITHUB = "github",
  DEVOPS = "devops"
}

export enum SQLStr {
  /*access depth coverage candidate table. */
  SQLSTR_INSERT_CANDIDATE = "INSERT INTO %s (resourceProvider, fullResourceType, fileName, apiVersion, tag, startDate, endDate) values (@resourceProvider, @fullResourceType, @fileName, @apiVersion, @tag, @startDate, @endDate)",
  SQLSTR_CLEAR_CANDIDATE = "DElETE from %s",
  SQLSTR_DELETE = "DELETE from %s where resourceProvider='%s' and fullResourceType='%s'",

  /*access code generation status table. */
  SQLSTR_INSERT_CODEGENERATION = "INSERT INTO %s (resourceProvider, resourcesToGenerate, tag, swaggerPR, codePR, sdk, type, ignoreFailure, excludeStages, pipelineBuildID, status) values (@resourceProvider, @resourcesToGenerate, @tag, @swaggerPR, @codePR, @sdk, @type, @ignoreFailure, @excludeStages, @pipelineBuildID, @status)",
  SQLSTR_UPDATE_CODEGENERATION = "UPDATE %s SET resourcesToGenerate=@resourcesToGenerate, tag=@tag, swaggerPR=@swaggerPR, codePR=@codePR, ignoreFailure=@ignoreFailure, excludeStages=@excludeStages, pipelineBuildID=@pipelineBuildID, status=@status where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_DELETE_CODEGENERATION = "DELETE FROM %s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_SELECT_CODEGENERATION = "SELECT * FROM %s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_UPDATE_CODEGENERATION_VALUE = "UPDATE %s SET %s=@%s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_LIST_CODEGENERATION = "SELECT * FROM %s where type=@type",
  SQLSTR_LIST_CODEGENERATION_BY_STATUS = "SELECT * FROM %s where status=@status",

  /* access sdk code generation table. */
  SQLSTR_INSERT_SDKCODEGENERATION = "INSERT INTO %s (name, resourceProvider, serviceType, resourcesToGenerate, tag, sdk, swaggerRepo, sdkRepo, codegenRepo, owner, type, lastPipelineBuildID, status) values (@name, @resourceProvider, @serviceType, @resourcesToGenerate, @tag, @sdk, @swaggerRepo, @sdkRepo, @codegenRepo, @owner, @type, @lastPipelineBuildID, @status)",
  SQLSTR_UPDATE_SDKCODEGENERATION = "UPDATE %s SET resourcesToGenerate=@resourcesToGenerate, tag=@tag, swaggerPR=@swaggerPR, codePR=@codePR, ignoreFailure=@ignoreFailure, excludeStages=@excludeStages, pipelineBuildID=@pipelineBuildID, status=@status where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_DELETE_SDKCODEGENERATION = "DELETE FROM %s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_SELECT_SDKCODEGENERATION = "SELECT * FROM %s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
  SQLSTR_SELECT_SDKCODEGENERATION_By_Name = "SELECT * FROM %s where name=@name",
  SQLSTR_UPDATE_SDKCODEGENERATION_VALUE = "UPDATE %s SET %s=@%s where name=@name",
  SQLSTR_UPDATE_SDKCODEGENERATION_VALUES = "UPDATE %s SET %s where name=@name",
  SQLSTR_LIST_SDKCODEGENERATION = "SELECT * FROM %s where type=@type",
  SQLSTR_LIST_SDKCODEGENERATION_BY_STATUS = "SELECT * FROM %s where status=@status",
}

export function readCVS(filepath: string): any[] {
  let results: any[] = [];
  try {
    console.log(__dirname + "/TFCandidate.csv");
    fs.createReadStream(filepath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        console.log(results);
      });
  } catch (e) {
    console.log("Failed to read candidate file.");
    console.log(e);
  }

  return results;
}

export function readCVSSync(filepath: string): any[] {
  const fileContent = fs.readFileSync(filepath);
  const records = parse(fileContent, { columns: true });
  // console.log(records);
  return records;
}
