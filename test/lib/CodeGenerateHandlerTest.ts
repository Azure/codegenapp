import CodeGenerateHandler from "../../src/lib/CodeGenerateHandler";
// import { CodeGenerateHandler } from "../../src/lib/CodeGenerateHandler";
import { readCVSSync } from "../../src/lib/common";
import {
  CodegenDBCredentials,
  DepthDBCredentials,
} from "../../src/lib/DBCredentials";
import { ENVKEY, ResourceAndOperation } from "../../src/lib/Model";
import { PipelineCredential } from "../../src/lib/PipelineCredential";
import { setup } from "../setup/setup";

var assert = require("assert");
describe("code generate handler test", () => {
  setup();
  it("Trigger Code Generation", async () => {
    let readmefile: string = "";
    let rs: ResourceAndOperation = new ResourceAndOperation(
      "testcodegenRP",
      readmefile,
      [],
      "terraform",
      "dev"
    );

    rs.generateResourceList();
    const err = await CodeGenerateHandler.TriggerCodeGeneration(
      PipelineCredential.token,
      "chunyu3",
      "depth-coverage-pipeline",
      "dev",
      rs
    );
    
    if (err !== undefined) {
      console.log(err);
    }
    assert(err === undefined);

    const cancelErr = await CodeGenerateHandler.CancelCodeGeneration(
      PipelineCredential.token,
      "testcodegenRP",
      "terraform",
      "dev",
      "chunyu3",
      "chunyu3",
      "chunyu3"
    );
    assert(cancelErr === undefined);
  });
});
