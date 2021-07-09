import {
  MessageRecord,
  PipelineResult,
  PipelineStatus,
  RawMessageRecord,
} from "@azure/swagger-validation-common";
import { CodegenPipelineTaskResult } from "./PipelineTask";
import * as yaml from "node-yaml";
import { PipelineRunningResult } from "../lib/CodeGenerationModel";

export function GenerateCodeGeneratePipelineTaskResult(
  pipelineBuildId: string,
  task: string,
  status: string,
  pipelineresult: string,
  logfile: string
): CodegenPipelineTaskResult {
  const lineReader = require("line-reader");
  let errorNum: number = 0;
  let warnNum: number = 0;
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
      if (line.toLowerCase().indexOf("error") !== -1 || line.toLowerCase().indexOf("FAIL") !== -1) {
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
      }
    });
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

  return result;
}

export function GenerateCodeGeneratePipelineTaskResultFile(
  pipelineBuildId: string,
  task: string,
  status: string,
  pipelineresult: string,
  logfile: string,
  pipelineResultLog: string
): CodegenPipelineTaskResult {
  const result: CodegenPipelineTaskResult = GenerateCodeGeneratePipelineTaskResult(
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
