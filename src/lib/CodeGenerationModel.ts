export class CodeGeneration {
    public constructor(rs: string, 
                        sdk: string, 
                        type: string = "depth",
                        resourcesToGenerate:string = "",
                        tag:string = "",
                        swaggerPR:string = "",
                        codePR: string = "",
                        ignoreFailure: string = "",
                        excludeStages: string = "",
                        pipelineBuildID: string = "",
                        status: string = "submit") {
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

    public toString() {
        return "(resourceProvider:" + this.resourceProvider + ", sdk: " + this.sdk + ", type:" + this.type + ")"; 
    }
}

export enum CodeGenerationStatus {
    CODE_GENERATION_STATUS_SUBMIT="submit",
    CODE_GENERATION_STATUS_IN_PROGRESS="inprogress",
    CODE_GENERATION_STATUS_CUSTOMIZING="customizing",
    CODE_GENERATION_STATUS_FAILED="failed",
    CODE_GENERATION_STATUS_CANCELED="cancelled",
    CODE_GENERATION_STATUS_PIPELINE_COMPLETED="pipelineCompleted",
    CODE_GENERATION_STATUS_COMPLETED="completed"
}

export enum CodeGenerationDBColumn {
    CODE_GENERATION_COLUMN_RESOURCE_PROVIDER="resourceProvider",
    CODE_GENERATION_COLUMN_RESOURCETOGENERATE="resourcesToGenerate",
    CODE_GENERATION_COLUMN_TAG="tag",
    CODE_GENERATION_COLUMN_SWAGGER_PULLREQUEST="swaggerPR",
    CODE_GENERATION_COLUMN_CODE_PULLREQUEST="codePR",
    CODE_GENERATION_COLUMN_SDK="sdk",
    CODE_GENERATION_COLUMN_TYPE="type",
    CODE_GENERATION_COLUMN_IGNOAREFAILURE="ignoreFailure",
    CODE_GENEERTION_COLUMN_EXCLUDESTAGES="excludeStages",
    CODE_GENERATION_COLUMN_PIPELINEBUILDID="pipelineBuildID",
    CODE_GENERATION_COLUMN_STATUS="status"
}