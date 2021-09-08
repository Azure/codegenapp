// import { readCVSSync } from "../../src/lib/common";
// import {
//   codegenDBConfig,
//   depthDBConfig,
// } from "../../src/config/sqldb/SqlConfig";
// import { github } from "../../src/config/github/github";
// import {ENV} from "../../src/config/env";
//
// export function setup() {
//   const depthDBcredentialFile = "test\\depthDB.csv";
//   if (depthDBcredentialFile !== undefined) {
//     // let credentials = readCVS(depthDBcredentialFile);
//     let credentials = readCVSSync(depthDBcredentialFile);
//     for (let cr of credentials) {
//       process.env[ENV.ENV_DEPTH_DB_SERVER] = cr["server"];
//       process.env[ENV.ENV_DEPTH_DATABASE] = cr["db"];
//       process.env[ENV.ENV_DEPTH_DB_USER] = cr["user"];
//       process.env[ENV.ENV_DEPTH_DB_PASSWORD] = cr["pw"];
//       break;
//     }
//   }
//
//   const codeDBcredentialFile = "test\\CodeDB.csv";
//   if (codeDBcredentialFile !== undefined) {
//     // let credentials = readCVS(codeDBcredentialFile);
//     let credentials = readCVSSync(codeDBcredentialFile);
//     for (let cr of credentials) {
//       process.env[ENV.ENV_CODEGEN_DB_SERVER] = cr["server"];
//       process.env[ENV.ENV_CODEGEN_DATABASE] = cr["db"];
//       process.env[ENV.ENV_CODEGEN_DB_USER] = cr["user"];
//       process.env[ENV.ENV_CODEGEN_DB_PASSWORD] = cr["pw"];
//       break;
//     }
//   }
//
//   const tokenFile = "test\\token.csv";
//   if (tokenFile !== undefined) {
//     // let credentials = readCVS(codeDBcredentialFile);
//     let tokens = readCVSSync(tokenFile);
//     for (let token of tokens) {
//       process.env[ENV.GITHUB_TOKEN] = token["token"];
//       break;
//     }
//   }
//
//   depthDBConfig.server = process.env[ENV.ENV_DEPTH_DB_SERVER];
//   depthDBConfig.database = process.env[ENV.ENV_DEPTH_DATABASE];
//   depthDBConfig.username = process.env[ENV.ENV_DEPTH_DB_USER];
//   depthDBConfig.password = process.env[ENV.ENV_DEPTH_DB_PASSWORD];
//
//   codegenDBConfig.server = process.env[ENV.ENV_CODEGEN_DB_SERVER];
//   codegenDBConfig.database = process.env[ENV.ENV_CODEGEN_DATABASE];
//   codegenDBConfig.username = process.env[ENV.ENV_CODEGEN_DB_USER];
//   codegenDBConfig.password = process.env[ENV.ENV_CODEGEN_DB_PASSWORD];
//
//   process.env[ENV.GITHUB_TOKEN] = process.env[ENV.GITHUB_TOKEN];
// }
