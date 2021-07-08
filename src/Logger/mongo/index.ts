import { CodegenPipelineTaskResult } from "../PipelineTask";
import { CodegenPipelineBuildResultsCollection } from "./CodegenPipelineBuildResultsCollection";
import { DbConnection, RequiredConfiguration } from "./DbConnection";
import { Db, MongoClient } from "mongodb";
import { exit } from "process";

export const getResults = async (
  database: RequiredConfiguration,
  buildId: string
) => {
  const pipelineResultsCol = new CodegenPipelineBuildResultsCollection(
    new DbConnection(database)
  );
  const results = await pipelineResultsCol.getFromBuild(buildId);
  for (let res of results) {
    console.log(res.name + "," + res.pipelineId);
  }
};

export async function putResults(
  database: RequiredConfiguration,
  buildId: string,
  result: CodegenPipelineTaskResult
) {
  const dbcon: DbConnection = new DbConnection(database);
  const pipelineResultsCol = new CodegenPipelineBuildResultsCollection(dbcon);

  await pipelineResultsCol.put(buildId, result);
  console.log("end");
  //   await dbcon.close();
}

let database: RequiredConfiguration = {
  mongoConnectionString:
    "mongodb://sdkcodegen:g2MhYaEUT4CMDdw18BGbduTkjFUFXB69tX6xpCHFEzgkp8mZBuTFY8OdzvDJctBdpOQiSctmjmOyKahnkr2ZeA==@sdkcodegen.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@sdkcodegen@",
  mongoDbName: "openapiPlatform",
};

let buildId: string = "3456790";

let result: CodegenPipelineTaskResult = {
  name: "build",
  pipelineId: buildId,
  status: "completed",
  result: "failure",
  errorCount: 3,
  warningCount: 2,
  checkRunId: 1,
  checkRunUrl: "",
  queuedAt: new Date(),
  messages: [
    {
      type: "Raw",
      level: "Error",
      message: "No property",
      time: new Date(),
    },
    {
      type: "Raw",
      level: "Error",
      message: "type mismatch",
      time: new Date(),
    },
  ],
};
putResults(database, buildId, result);
console.log("close");
getResults(database, buildId);
// exit(0);
