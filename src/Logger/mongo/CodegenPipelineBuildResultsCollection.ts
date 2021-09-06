import { CodegenPipelineTaskResult } from "../PipelineTask";
import { Collection } from "mongodb";
import { DbConnection } from "./DbConnection";

export interface CodegenPipelineResultItem {
  key: string;
  pipelineBuildId: string;
  taskResult: CodegenPipelineTaskResult;
}
export class CodegenPipelineBuildResultsCollection {
  public static readonly collectionName = "sdkGenerationResults";
  private pipelineResultCol!: Promise<Collection<CodegenPipelineResultItem>>;
  constructor(private db: DbConnection) {}

  private get collection(): Promise<Collection<CodegenPipelineResultItem>> {
    if (!this.pipelineResultCol) {
      this.pipelineResultCol = this.db.pipelineRunsDb.then((db) => {
        return db.collection<CodegenPipelineResultItem>(
          CodegenPipelineBuildResultsCollection.collectionName
        );
      });
    }

    if (!this.pipelineResultCol) {
      throw new Error("invalid state: pipelineResultCol is not available");
    }

    return this.pipelineResultCol;
  }

  public async getFromKey(
    pipelineBuildId: string,
    taskKey: string
  ): Promise<CodegenPipelineTaskResult | null> {
    const key = this.getKey(pipelineBuildId, taskKey);
    const collection = await this.collection;
    const match = await collection.findOne({ key });
    if (match) {
      return match.taskResult;
    }
    return match;
  }

  public async getFromBuild(
    pipelineBuildId: string
  ): Promise<CodegenPipelineTaskResult[]> {
    const collection = await this.collection;
    const match = await collection
      .find({ pipelineBuildId })
      .map((it) => it.taskResult)
      .toArray();
    return match;
  }

  public async addMany(
    pipelineBuildId: string,
    taskResult: CodegenPipelineTaskResult[]
  ) {
    const collection = await this.collection;
    const items = taskResult.map((t) => {
      const key = this.getKey(pipelineBuildId, t.name);
      return {
        key,
        pipelineBuildId,
        taskResult: t,
      } as CodegenPipelineResultItem;
    });
    await collection.insertMany(items);
  }

  public async put(
    pipelineBuildId: string,
    taskResult: CodegenPipelineTaskResult
  ) {
    const key = this.getKey(pipelineBuildId, taskResult.name);
    const collection = await this.collection;

    const entry: CodegenPipelineResultItem = {
      key,
      pipelineBuildId,
      taskResult,
    };
    await collection.replaceOne({ key }, entry, { upsert: true });
  }

  public getKey(pipelineBuildId: string, taskKey: string) {
    return `${pipelineBuildId}/${taskKey}`;
  }
}
