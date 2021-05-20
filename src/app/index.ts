import "reflect-metadata";
import codegenApp from "./codegenApp";
import { ENVKEY } from "../lib/Model";
import { readCVS, readCVSSync } from "../lib/common";

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

const args = parseArgs(process.argv);
export const depthDBcredentialFile = args["depthDB"];
export const codeDBcredentialFile = args["codeGenDB"];

if (depthDBcredentialFile !== undefined) {
  // let credentials = readCVS(depthDBcredentialFile);
  let credentials = readCVSSync(depthDBcredentialFile);
  for (let cr of credentials) {
    process.env[ENVKEY.ENV_DEPTH_DB_SERVER] = cr["server"];
    process.env[ENVKEY.ENV_DEPTH_DATABASE] = cr["db"];
    process.env[ENVKEY.ENV_DEPTH_DB_USER] = cr["user"];
    process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD] = cr["pw"];
    break;
  }
}

if (codeDBcredentialFile !== undefined) {
  // let credentials = readCVS(codeDBcredentialFile);
  let credentials = readCVSSync(codeDBcredentialFile);
  for (let cr of credentials) {
    process.env[ENVKEY.ENV_CODEGEN_DB_SERVER] = cr["server"];
    process.env[ENVKEY.ENV_CODEGEN_DATABASE] = cr["db"];
    process.env[ENVKEY.ENV_CODEGEN_DB_USER] = cr["user"];
    process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD] = cr["pw"];
  }
}
process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN] = args["token"];
codegenApp.start();
