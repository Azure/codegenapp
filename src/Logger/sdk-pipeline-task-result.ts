import {
  MessageRecord,
  PipelineResult,
  PipelineStatus,
  RawMessageRecord,
} from "@azure/swagger-validation-common";
import {
  CodegenCodeGenerateTaskResult,
  CodegenPipelineTaskResult,
  TestTaskResult,
} from "./PipelineTask";
import * as yaml from "node-yaml";
import { CodeGenerationPipelineTaskName } from "../lib/common";

export function GenerateCodeGeneratePipelineTaskResult(
  codegenname: string,
  pipelineBuildId: string,
  task: string,
  status: string,
  pipelineresult: string,
  logfile: string
): CodegenPipelineTaskResult {
  const lineReader = require("line-reader");
  let errorNum: number = 0;
  let warnNum: number = 0;
  let codeCoverage: number = 0;
  let messages: MessageRecord[] = [];
  // lineReader.eachLine(logfile, (line) => {
  //     console.log(line);
  //     if (line.toLowerCase().indexOf("error") !== -1) errorNum++;
  //     else if (line.toLowerCase().indexOf("warning") !== -1) warnNum++;
  // });
  const fs = require("fs");
  if (fs.existsSync(logfile)) {
    var lines = require("fs")
      .readFileSync(logfile, "utf-8")
      .split("\n")
      .filter(Boolean);
    lines.forEach((line) => {
      console.log(line);
      if (
        line.toLowerCase().indexOf("error") !== -1 ||
        line.toLowerCase().indexOf("fail") !== -1 ||
        line.toLowerCase().indexOf("fatal") !== -1
      ) {
        errorNum++;
        let message: RawMessageRecord = {
          level: "Error",
          message: line,
          time: new Date(),
          type: "Raw",
        };
        messages.push(message);
      } else if (line.toLowerCase().indexOf("warning") !== -1) {
        warnNum++;
      } else if (line.toLowerCase().indexOf("exception") !== -1) {
        errorNum++;
        let message: RawMessageRecord = {
          level: "Error",
          message: line,
          time: new Date(),
          type: "Raw",
        };
        messages.push(message);
      } else if (line.toLowerCase().indexOf("coverage:") !== -1) {
        let coverage: string = line.replace("coverage:", "").trim();
        codeCoverage= parseFloat(coverage)/100;
      }
    });
  } else {
    console.log("logfile " + logfile + " does not exist.");
  }

  let result: CodegenPipelineTaskResult = {
    name: task,
    pipelineId: pipelineBuildId,
    status: status as PipelineStatus,
    result: pipelineresult as PipelineResult,
    errorCount: errorNum,
    warningCount: warnNum,
    checkRunId: 0,
    checkRunUrl: "",
    queuedAt: new Date(),
    messages: messages,
  };
  // if (messages.length > 0) {
  //   result.messages = messages;
  // }

  
  if (task === CodeGenerationPipelineTaskName.GENERATE_CODE) {
    (result as CodegenCodeGenerateTaskResult).codeUrl = FormatCodeUrl(
      codegenname,
      pipelineBuildId
    );
  }
  if (task === CodeGenerationPipelineTaskName.MOCK_TEST || task === CodeGenerationPipelineTaskName.LIVE_TEST) {
    (result as TestTaskResult).codeCoverage = codeCoverage;
  }
  return result;
}

export function GenerateCodeGeneratePipelineTaskResultFile(
  codegenname: string,
  pipelineBuildId: string,
  task: string,
  status: string,
  pipelineresult: string,
  logfile: string,
  pipelineResultLog: string
): CodegenPipelineTaskResult {
  const result: CodegenPipelineTaskResult = GenerateCodeGeneratePipelineTaskResult(
    codegenname,
    pipelineBuildId,
    task,
    status,
    pipelineresult,
    logfile
  );

  if (pipelineResultLog !== undefined) {
    const fs = require("fs");
    fs.writeFileSync(pipelineResultLog, JSON.stringify(result, null, 2));
  }

  return result;
}

export function FormatCodeUrl(
  codegenname: string,
  pipelineBuildID: string
): string {
  return (
    "https://depthcoverage.blob.core.windows.net/depthcoverage/" +
    codegenname +
    "-" +
    pipelineBuildID +
    "-generated.tar.gz"
  );
}
