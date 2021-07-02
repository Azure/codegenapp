import CodeGenerateHandler from "../../src/lib/CodeGenerateHandler";
// import { CodeGenerateHandler } from "../../src/lib/CodeGenerateHandler";
import { OnboardType, readCVSSync } from "../../src/lib/common";
import {
  CodegenDBCredentials,
  DepthDBCredentials,
} from "../../src/lib/sqldb/DBCredentials";
import { ENVKEY, ResourceAndOperation, SERVICE_TYPE } from "../../src/lib/Model";
import { PipelineCredential } from "../../src/lib/pipeline/PipelineCredential";
import { setup } from "../setup/setup";
import { default_dev_codegen_repo, default_dev_swagger_repo, default_dev_terraform_repo, getGitRepoInfo } from "../../src/config";
import { CodeGenerationStatus } from "../../src/lib/CodeGenerationModel";
import { pipeline } from "node:stream";

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
      OnboardType.ADHOC,
      SERVICE_TYPE.RESOURCE_MANAGE,
      default_dev_swagger_repo,
      default_dev_codegen_repo,
      default_dev_terraform_repo
    );

    rs.generateResourceList();
    const { org: codegenorg, repo: codegenreponame } = getGitRepoInfo(
      default_dev_codegen_repo
    );
    const createRet = await CodeGenerateHandler.CreateSDKCodeGeneration("uitestcg", PipelineCredential.token, codegenorg, codegenreponame, default_dev_codegen_repo.branch, rs, "UITester")

    if (createRet !== undefined) {
      console.log(createRet);
    }
    assert(createRet === undefined);

    const {codegen, err} = await CodeGenerateHandler.GetSDKCodeGeneration("uitestcg");
    assert(err === undefined);
    assert(codegen.name === "uitestcg");
    assert(codegen.resourceProvider === "testcodegenRP");
    assert(codegen.sdk === "terraform");
    assert(codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_SUBMIT);

    const cancelErr = await CodeGenerateHandler.CancelSDKCodeGeneration(PipelineCredential.token, "uitestcg");
    assert(cancelErr === undefined);
    const {codegen:cg1, err:err1} = await CodeGenerateHandler.GetSDKCodeGeneration("uitestcg");
    assert(cg1 !== undefined);
    assert(cg1.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED);

    const completeRet = CodeGenerateHandler.CompleteSDKCodeGeneration(PipelineCredential.token, "uitestcg");
    assert(completeRet === undefined);
    const {codegen:cg2, err:err2} = await CodeGenerateHandler.GetSDKCodeGeneration("uitestcg");
    assert(cg2 === undefined);
    assert(cg2.status === CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED);

    const delret = await CodeGenerateHandler.DeleteSDKCodeGeneration(PipelineCredential.token, "uitestcg");
    assert(delret === undefined);
    const {codegen:cg3, err:err3} = await CodeGenerateHandler.GetSDKCodeGeneration("uitestcg");
    assert(cg3 === undefined);
  });
});
