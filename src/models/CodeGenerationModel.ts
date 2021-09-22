import { CodeGeneration } from './entity/codegenSqlServer/entity/CodeGeneration';
import { TaskResult } from './entity/taskResultMongodb/entity/TaskResult';

export enum CodeGenerationStatus {
    CODE_GENERATION_STATUS_SUBMIT = 'submit',
    CODE_GENERATION_STATUS_IN_PROGRESS = 'in_progress',
    CODE_GENERATION_STATUS_CUSTOMIZING = 'customizing',
    CODE_GENERATION_STATUS_FAILED = 'failed',
    CODE_GENERATION_STATUS_CANCELED = 'cancelled',
    CODE_GENERATION_STATUS_PIPELINE_COMPLETED = 'pipelineCompleted',
    CODE_GENERATION_STATUS_COMPLETED = 'completed',
}

export enum CodeGenerationDBColumn {
    CODE_GENERATION_COLUMN_RESOURCE_PROVIDER = 'resourceProvider',
    CODE_GENERATION_COLUMN_RESOURCETOGENERATE = 'resourcesToGenerate',
    CODE_GENERATION_COLUMN_TAG = 'tag',
    CODE_GENERATION_COLUMN_SWAGGER_PULLREQUEST = 'swaggerPR',
    CODE_GENERATION_COLUMN_CODE_PULLREQUEST = 'codePR',
    CODE_GENERATION_COLUMN_SDK = 'sdk',
    CODE_GENERATION_COLUMN_TYPE = 'type',
    CODE_GENERATION_COLUMN_IGNOAREFAILURE = 'ignoreFailure',
    CODE_GENEERTION_COLUMN_EXCLUDESTAGES = 'excludeStages',
    CODE_GENERATION_COLUMN_PIPELINEBUILDID = 'pipelineBuildID',
    CODE_GENERATION_COLUMN_STATUS = 'status',
}

export interface RepoInfo {
    type: string;
    path: string;
    branch: string;
}

export interface IRepoInfo {
    (repoInfo: RepoInfo): { org: string; repo: string };
}

export class SDKCodeGenerationDetailInfo extends CodeGeneration {
    public constructor(
        name: string,
        resourceProvider: string,
        serviceType: string,
        resourcesToGenerate: string,
        tag: string,
        sdk: string,
        swaggerRepo: RepoInfo,
        sdkRepo: RepoInfo,
        codegenRepo: RepoInfo,
        owner: string,
        type: string = 'depth',
        swaggerPR: string = '',
        codePR: string = '',
        pipelineBuildID: string = '',
        status: string = 'submit',
        results: TaskResult[] = []
    ) {
        super();
        this.name = name;
        this.resourceProvider = resourceProvider;
        this.serviceType = serviceType;
        this.resourcesToGenerate = resourcesToGenerate;
        this.tag = tag;
        this.sdk = sdk;
        this.swaggerRepo = JSON.stringify(swaggerRepo);
        this.sdkRepo = JSON.stringify(sdkRepo);
        this.codegenRepo = JSON.stringify(codegenRepo);
        this.owner = owner;
        this.type = type;
        this.swaggerPR = swaggerPR;
        this.codePR = codePR;
        this.lastPipelineBuildID = pipelineBuildID;
        this.status = status;
        this.taskResults = results;
    }

    public taskResults: TaskResult[] = [];
}
