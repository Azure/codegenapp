import { readCVSSync } from "../../src/lib/common";
import {
  CodegenDBCredentials,
  DepthDBCredentials,
} from "../../src/lib/DBCredentials";
import { ENVKEY } from "../../src/lib/Model";
import { PipelineCredential } from "../../src/lib/PipelineCredential";

export function setup() {
  const depthDBcredentialFile = "test\\depthDB.csv";
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

  const codeDBcredentialFile = "test\\CodeDB.csv";
  if (codeDBcredentialFile !== undefined) {
    // let credentials = readCVS(codeDBcredentialFile);
    let credentials = readCVSSync(codeDBcredentialFile);
    for (let cr of credentials) {
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER] = cr["server"];
      process.env[ENVKEY.ENV_CODEGEN_DATABASE] = cr["db"];
      process.env[ENVKEY.ENV_CODEGEN_DB_USER] = cr["user"];
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD] = cr["pw"];
      break;
    }
  }

  const tokenFile = "test\\token.csv";
  if (tokenFile !== undefined) {
    // let credentials = readCVS(codeDBcredentialFile);
    let tokens = readCVSSync(tokenFile);
    for (let token of tokens) {
      process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN] = token["token"];
      break;
    }
  }

  DepthDBCredentials.server = process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
  DepthDBCredentials.db = process.env[ENVKEY.ENV_DEPTH_DATABASE];
  DepthDBCredentials.user = process.env[ENVKEY.ENV_DEPTH_DB_USER];
  DepthDBCredentials.pw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];

  CodegenDBCredentials.server = process.env[ENVKEY.ENV_CODEGEN_DB_SERVER];
  CodegenDBCredentials.db = process.env[ENVKEY.ENV_CODEGEN_DATABASE];
  CodegenDBCredentials.user = process.env[ENVKEY.ENV_CODEGEN_DB_USER];
  CodegenDBCredentials.pw = process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD];

  PipelineCredential.token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
}
