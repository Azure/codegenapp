import {
  default_codegen_repo,
  default_swagger_repo,
  sdk_repos,
} from "../config";
import { Resource } from "../depthcoverage/QueryDepthCoverageReport";
import { RepoInfo } from "./CodeGenerationModel";
import { OnboardType, SDK } from "./common";

export const RESOUCEMAPFile = "ToGenerate.json";

export enum ENVKEY {
  ENV_DEPTH_DB_SERVER = "DepthDBServer",
  ENV_DEPTH_DATABASE = "DepthDatabase",
  ENV_DEPTH_DB_USER = "DepthDBUsername",
  ENV_DEPTH_DB_PASSWORD = "DepthDBPassword",
  ENV_REPO_ACCESS_TOKEN = "RepoAccessToken",
  ENV_CODEGEN_DB_SERVER = "DBServer",
  ENV_CODEGEN_DATABASE = "Database",
  ENV_CODEGEN_DB_USER = "DBUsername",
  ENV_CODEGEN_DB_PASSWORD = "DBPassword",
}

export enum SERVICE_TYPE {
  RESOURCE_MANAGE = "resource-manager",
  DATA_PLAN = "data-plan",
}

export interface JsonOperationMap {
  jsonfile: string;
  ops: string;
}

export class ResourceAndOperation {
  public constructor(
    RPName: string,
    readme: string,
    resources: OnboardResource[],
    target: string,
    type: string = OnboardType.DEPTH_COVERAGE,
    stype?: string,
    swagger?: RepoInfo,
    codegen_repo?: RepoInfo
  ) {
    this.RPName = RPName;
    this.readmeFile = readme;
    this.resources = resources;
    this.target = target;
    this.onboardType = type;
    if (stype !== undefined) {
      this.serviceType = stype;
    }
    this.sdkRepo = sdk_repos[target];

    if (swagger !== undefined) {
      this.swaggerRepo = swagger;
    }

    if (codegen_repo !== undefined) {
      this.codegenRepo = codegen_repo;
    }
  }
  public name: string;
  public RPName: string;
  public serviceType: string = SERVICE_TYPE.RESOURCE_MANAGE;
  public readmeFile: string;
  public target: string;
  public resources: OnboardResource[] = [];
  public ignoreFailures: string;
  public excludeStages: string;
  public tag: string;
  public resourcelist: string = "";
  public onboardType: string = OnboardType.DEPTH_COVERAGE;
  public swaggerRepo: RepoInfo = default_swagger_repo;
  public sdkRepo: RepoInfo = undefined;
  public codegenRepo: RepoInfo = default_codegen_repo;

  // public jsonFilelist: string[] = [];
  public jsonFileList: JsonOperationMap[] = [];

  // public Resource: string;
  // public operations: DepthCoverageOperation[] = [];
  public generateResourceList() {
    for (let r of this.resources) {
      if (this.resourcelist.length === 0) {
        this.resourcelist = r.Resource;
      } else {
        this.resourcelist = this.resourcelist + "," + r.Resource;
      }
    }
  }
}

export class OnboardResource {
  public constructor(rs: string, version: string) {
    this.Resource = rs;
    this.APIVersion = version;
  }
  public Resource: string;
  public APIVersion: string = undefined;
  public operations: OnboardOperation[] = [];
  public tag: string;
}
export class OnboardOperation {
  public constructor(id: string, version: string, jsonfile: string) {
    this.OperationId = id;
    this.version = version;
    this.jsonFilePath = jsonfile;
  }
  public OperationId: string;
  public version: string;
  public jsonFilePath: string;
}
