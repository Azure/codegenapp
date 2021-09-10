import { inject, injectable } from 'inversify';
import {
    CodegenPipelineTaskResult,
    TaskResult,
} from '../models/entity/taskResultMongodb/entity/TaskResult';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { Connection, MongoRepository } from 'typeorm';
import { TaskResultDao } from '../dao/taskResultDao';

@injectable()
export class TaskResultDaoImpl implements TaskResultDao {
    private repo: MongoRepository<TaskResult>;

    constructor(
        @inject(InjectableTypes.MongoDbConnection) connection: Connection
    ) {
        this.repo = connection.getMongoRepository(TaskResult);
    }

    public async getFromBuild(pipelineBuildId: string): Promise<TaskResult[]> {
        const taskResults: TaskResult[] = await this.repo.find({
            pipelineBuildId: pipelineBuildId,
        });
        return taskResults;
    }

    public async put(
        pipelineBuildId: string,
        taskResult: CodegenPipelineTaskResult
    ) {
        const key = `${pipelineBuildId}/${taskResult.name}`;
        await this.repo.findOneAndReplace(
            { key: key },
            {
                key: key,
                pipelineBuildId: pipelineBuildId,
                taskResult: taskResult,
            },
            { upsert: true }
        );
    }
}
