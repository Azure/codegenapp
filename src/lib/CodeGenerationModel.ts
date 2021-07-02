export class CodeGeneration {
  public constructor(
    rs: string,
    sdk: string,
    type: string = "depth",
    resourcesToGenerate: string = "",
    tag: string = "",
    swaggerPR: string = "",
    codePR: string = "",
    ignoreFailure: string = "",
    excludeStages: string = "",
    pipelineBuildID: string = "",
    status: string = "submit"
  ) {
    this.resourceProvider = rs;
    this.sdk = sdk;
    this.type = type;
    this.resourcesToGenerate = resourcesToGenerate;
    this.tag = tag;
    this.swaggerPR = swaggerPR;
    this.codePR = codePR;
    this.ignoreFailure = ignoreFailure;
    this.excludeStages = excludeStages;
    this.pipelineBuildID = pipelineBuildID;
    this.status = status;
  }
  public resourceProvider: string;
  public resourcesToGenerate: string = "ALL";
  public tag: string;
  public swaggerPR: string;
  public codePR: string;
  public sdk: string;
  public type: string;
  public ignoreFailure: string;
  public excludeStages: string;
  public pipelineBuildID: string;
  public status: string;
  public results: PipelineRunningResult;

  public toString() {
    return (
      "(resourceProvider:" +
      this.resourceProvider +
      ", sdk: " +
      this.sdk +
      ", type:" +
      this.type +
      ")"
    );
  }
}

export enum CodeGenerationStatus {
  CODE_GENERATION_STATUS_SUBMIT = "submit",
  CODE_GENERATION_STATUS_IN_PROGRESS = "in_progress",
  CODE_GENERATION_STATUS_CUSTOMIZING = "customizing",
  CODE_GENERATION_STATUS_FAILED = "failed",
  CODE_GENERATION_STATUS_CANCELED = "cancelled",
  CODE_GENERATION_STATUS_PIPELINE_COMPLETED = "pipelineCompleted",
  CODE_GENERATION_STATUS_COMPLETED = "completed",
}

export enum CodeGenerationDBColumn {
  CODE_GENERATION_COLUMN_RESOURCE_PROVIDER = "resourceProvider",
  CODE_GENERATION_COLUMN_RESOURCETOGENERATE = "resourcesToGenerate",
  CODE_GENERATION_COLUMN_TAG = "tag",
  CODE_GENERATION_COLUMN_SWAGGER_PULLREQUEST = "swaggerPR",
  CODE_GENERATION_COLUMN_CODE_PULLREQUEST = "codePR",
  CODE_GENERATION_COLUMN_SDK = "sdk",
  CODE_GENERATION_COLUMN_TYPE = "type",
  CODE_GENERATION_COLUMN_IGNOAREFAILURE = "ignoreFailure",
  CODE_GENEERTION_COLUMN_EXCLUDESTAGES = "excludeStages",
  CODE_GENERATION_COLUMN_PIPELINEBUILDID = "pipelineBuildID",
  CODE_GENERATION_COLUMN_STATUS = "status",
}

export class PipelineRunningResult {
  results: StageResult[];
}

export class StageResult {}

export class SDKCodeGeneration {
  public constructor(
    name: string,
    rs: string,
    stype: string,
    resourcesToGenerate: string,
    tag: string,
    sdk: string,
    swagger: RepoInfo,
    sdk_repo: RepoInfo,
    codegen_repo: RepoInfo,
    owner: string,
    type: string = "depth",
    swaggerPR: string = "",
    codePR: string = "",
    pipelineBuildID: string = "",
    status: string = "submit"
  ) {
    this.name = name;
    this.resourceProvider = rs;
    this.serviceType = stype;
    this.resourcesToGenerate = resourcesToGenerate;
    this.tag = tag;
    this.sdk = sdk;
    this.swaggerRepo = swagger;
    this.sdkRepo = sdk_repo;
    this.codegenRepo = codegen_repo;
    this.owner = owner;
    this.type = type;
    this.swaggerPR = swaggerPR;
    this.codePR = codePR;
    this.lastPipelineBuildID = pipelineBuildID;
    this.status = status;
  }
  public id: number;
  public name: string;
  public resourceProvider: string;
  public serviceType: string;
  public resourcesToGenerate: string = "ALL";
  public tag: string;
  public sdk: string;
  public swaggerRepo: RepoInfo;
  public sdkRepo: RepoInfo;
  public codegenRepo: RepoInfo;
  public type: string;
  public ignoreFailure: string;
  public stages: string;
  public lastPipelineBuildID: string;

  public swaggerPR: string;
  public codePR: string;
  public status: string;

  public owner: string;

  public toString() {
    return (
      this.name +
      "(resourceProvider:" +
      this.resourceProvider +
      ", sdk: " +
      this.sdk +
      ", type:" +
      this.type +
      ")"
    );
  }
}

export interface RepoInfo {
  type: string;
  path: string;
  branch: string;
}

export interface IRepoInfo {
  (repoInfo: RepoInfo): { org: string; repo: string };
}
