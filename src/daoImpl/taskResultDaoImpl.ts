import { TaskResultDao } from '../dao/taskResultDao';
import { injectableTypes } from '../injectableTypes/injectableTypes';
import { CodegenPipelineTaskResult, TaskResult } from '../models/entity/TaskResult';
import { inject, injectable } from 'inversify';
import { Connection, MongoRepository } from 'typeorm';

@injectable()
export class TaskResultDaoImpl implements TaskResultDao {
    private repo: MongoRepository<TaskResult>;

    constructor(@inject(injectableTypes.MongoDbConnection) connection: Connection) {
        this.repo = connection.getMongoRepository(TaskResult);
    }

    public async getFromBuild(pipelineBuildId: string): Promise<CodegenPipelineTaskResult[]> {
        const taskResults: TaskResult[] = await this.repo.find({
            pipelineBuildId: pipelineBuildId,
        });
        const results: CodegenPipelineTaskResult[] = [];
        for (const taskResult of taskResults) {
            results.push(taskResult.taskResult);
        }
        return results;
    }

    public async put(pipelineBuildId: string, taskResult: CodegenPipelineTaskResult) {
        const key = `${pipelineBuildId}/${taskResult.name}`;
        await this.repo.findOneAndReplace(
            { key: key },
            {
                key: key,
                pipelineBuildId: pipelineBuildId,
                taskResult: taskResult,
            },
            { upsert: true },
        );
    }
}
