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
  task: string,
  status: string,
  pipelineresult: string,
  logfile: string,
  pipelineResultLog: string
) {
  const fs = require("fs");
  const lineReader = require("line-reader");
  let errorNum: number = 0;
  let warnNum: number = 0;
  let messages: MessageRecord[] = [];
  // lineReader.eachLine(logfile, (line) => {
  //     console.log(line);
  //     if (line.toLowerCase().indexOf("error") !== -1) errorNum++;
  //     else if (line.toLowerCase().indexOf("warning") !== -1) warnNum++;
  // });
  var lines = require("fs")
    .readFileSync(logfile, "utf-8")
    .split("\n")
    .filter(Boolean);
  lines.forEach((line) => {
    console.log(line);
    if (line.toLowerCase().indexOf("error") !== -1) {
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
  // let result: CodegenPipelineTaskResult = {
  //     name: "GenerateCode",
  //     status: "completed",
  //     result: "success",
  //     errorCount?: number;
  //     warningCount?: number;
  //     checkRunId: number;
  //     checkRunUrl: string;
  //     checkState?: string;
  //     azurePipelineUrl?: string;
  //     pipelineJobId?: string;
  //     pipelineTaskId?: string;
  //     queuedAt: Date;
  //     inProgressAt?: Date;
  //     completedAt?: Date;
  //     labels?: string[];
  //     messages?: MessageRecord[];
  // }
  let result: CodegenPipelineTaskResult = {
    name: task,
    pipelineId: "3333",
    status: status as PipelineStatus,
    result: pipelineresult as PipelineResult,
    errorCount: errorNum,
    warningCount: warnNum,
    checkRunId: 0,
    checkRunUrl: "",
    queuedAt: new Date(),
  };
  if (messages.length > 0) {
    result.messages = messages;
  }

  fs.writeFileSync(pipelineResultLog, yaml.dump(result));
}
