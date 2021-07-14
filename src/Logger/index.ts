import { GenerateCodeGeneratePipelineTaskResultFile } from "./sdk-pipeline-task-result";

const main = () => {
  const args = parseArgs(process.argv);
  const codegenname = args["codegen"];
  const pipeline_buildId = args["pipelineBuildId"];
  const task = args["task"];
  const status = args["status"];
  const pipelineresult = args["result"];
  const logfile = args["logfile"];
  const pipeline_log = args["pipelineLog"];

  return GenerateCodeGeneratePipelineTaskResultFile(
    codegenname,
    pipeline_buildId,
    task,
    status,
    pipelineresult,
    logfile,
    pipeline_log
  );
};

/**
 * Parse a list of command line arguments.
 * @param argv List of cli args(process.argv)
 */
const FLAG_REGEX = /^--([^=:]+)([=:](.+))?$/;
export const parseArgs = (argv: string[]) => {
  const result: any = {};
  for (const arg of argv) {
    const match = FLAG_REGEX.exec(arg);
    if (match) {
      const key = match[1];
      const rawValue = match[3];
      result[key] = rawValue;
    }
  }
  return result;
};

main();
