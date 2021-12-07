import { RepoInfo } from '../models/CodeGenerationModel';
import { ResourceAndOperation } from '../models/ResourceAndOperationModel';
import { CodeGeneration } from '../models/entity/CodeGeneration';
import { CodegenPipelineTaskResult } from '../models/entity/TaskResult';

export interface CodeGenerationService {
    updateCodeGenerationValuesByName(name: string, values: any);

    getCodeGenerationByName(name: string);

    createCodeGeneration(
        name: string,
        resourceProvider: string,
        resources: string,
        sdk: string,
        type: string,
        serviceType: string,
        swaggerRepo: RepoInfo,
        codegenRepo: RepoInfo,
        sdkRepo: RepoInfo,
        commit: string,
        owner: string,
        tag: string,
    );

    getBranch(repoInfo: RepoInfo, branchName: string);

    getGitRepoInfo(repoInfo: RepoInfo);

    deleteSDKCodeGeneration(codegen: CodeGeneration);

    getTaskResultByPipelineId(id: string);

    listCodeGenerations(filters: any, filterCompleted: boolean);

    completeCodeGeneration(codegen: CodeGeneration);

    cancelCodeGeneration(codegen: CodeGeneration);

    runCodeGeneration(codegen: CodeGeneration);

    customizeCodeGeneration(name: string, triggerPR: string, codePR: string, excludeTest: boolean);

    submitGeneratedCode(codegen: CodeGeneration);

    publishTaskResult(pipelineBuildId: string, taskResult: CodegenPipelineTaskResult);

    generateCodePullRequest(org: string, repo: string, title: string, branch: string, basebranch: string);

    completeAllCodeGenerations();

    runCodeGenerationForCI(): void;

    createCodeGenerationByCreatingPR(name: string, codegenOrg: string, codegenRepo: string, codegenBaseBranch: string, rpToGen: ResourceAndOperation, owner?: string);
}
