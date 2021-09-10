import { CodegenPipelineTaskResult } from '../models/entity/taskResultMongodb/entity/TaskResult';

export interface TaskResultDao {
    getFromBuild(pipelineBuildId: string);
    put(pipelineBuildId: string, taskResult: CodegenPipelineTaskResult);
}
