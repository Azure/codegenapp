import { RepoInfo } from '../models/CodeGenerationModel';
import { CodeGeneration } from '../models/entity/codegenSqlServer/entity/CodeGeneration';
import { CodegenPipelineTaskResult } from '../models/entity/taskResultMongodb/entity/TaskResult';

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
        tag: string
    );
    deleteSDKCodeGeneration(codegen: CodeGeneration);
    getTaskResultByPipelineId(id: string);
    listCodeGenerations(filters: {}, filterCompleted: boolean);
    completeCodeGeneration(codegen: CodeGeneration);
    cancelCodeGeneration(codegen: CodeGeneration);
    runCodeGeneration(codegen: CodeGeneration);
    customizeCodeGeneration(
        name: string,
        triggerPR: string,
        codePR: string,
        excludeTest: boolean
    );
    submitGeneratedCode(codegen: CodeGeneration);
    publishTaskResult(
        pipelineBuildId: string,
        taskResult: CodegenPipelineTaskResult
    );
    generateCodePullRequest(
        org: string,
        repo: string,
        title: string,
        branch: string,
        basebranch: string
    );
    completeAllCodeGenerations();
}
