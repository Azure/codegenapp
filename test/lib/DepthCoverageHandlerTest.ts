import { readCVSSync } from "../../src/lib/common";
import { ENVKEY } from "../../src/lib/Model";
import DepthCoverageHandler from "../../src/lib/DepthCoverageHandler";

var assert = require("assert");
describe("depth coverage handler test", () => {
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
    }
  }

  it('trigger depth coverage', async () => {
      DepthCoverageHandler.TriggerOnboard(process.env[ENVKEY.ENV_DEPTH_DB_SERVER],
          process.env[ENVKEY.ENV_DEPTH_DATABASE],
          process.env[ENVKEY.ENV_DEPTH_DB_USER],
          process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD],
          "4f655f07cb244bd5771b8625bf27859b710f9efd",
          "chunyu3",
          "depth-coverage-pipeline");
  });
});
