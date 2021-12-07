import { CodeGeneration } from './entity/CodeGeneration';
import { CodegenPipelineTaskResult } from './entity/TaskResult';

export enum CodeGenerationStatus {
    CodeGenerationStatusSubmit = 'submit',
    CodeGenerationStatusInProgress = 'in_progress',
    CodeGenerationStatusCustomizing = 'customizing',
    CodeGenerationStatusFailed = 'failed',
    CodeGenerationStatusCancelled = 'cancelled',
    CodeGenerationStatusPipelineCompleted = 'pipelineCompleted',
    CodeGenerationStatusCompleted = 'completed',
}

export enum CodeGenerationDBColumn {
    CodeGenerationColumnResourceProvider = 'resourceProvider',
    CodeGenerationColumnResourceToGenerate = 'resourcesToGenerate',
    CodeGenerationColumnTag = 'tag',
    CodeGenerationColumnSwaggerPullRequest = 'swaggerPR',
    CodeGenerationColumnCodePullRequest = 'codePR',
    CodeGenerationColumnSdk = 'sdk',
    CodeGenerationColumnType = 'type',
    CodeGenerationColumnIgnoreFailure = 'ignoreFailure',
    CodeGenerationColumnExcludeStages = 'excludeStages',
    CodeGenerationColumnPipelineBuildId = 'pipelineBuildID',
    CodeGenerationColumnStatus = 'status',
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
        type = 'depth',
        swaggerPR = '',
        codePR = '',
        pipelineBuildID = '',
        status = 'submit',
        results: CodegenPipelineTaskResult[] = [],
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

    public taskResults: CodegenPipelineTaskResult[] = [];
}
