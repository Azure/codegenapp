import {
  BaseHttpController,
  controller,
  httpPost,
} from "inversify-express-utils";
import { JsonResult } from "inversify-express-utils/dts/results";
import { Request, Response, response } from "express";
import {
  getCodeGeneration,
  UpdateCodeGenerationValue,
} from "../lib/CodeGeneration";
import CodeGenerateHandler from "../lib/CodeGenerateHandler";
import { PipelineCredential } from "../lib/PipelineCredential";
import { ENVKEY, ResourceAndOperation } from "../lib/Model";
import { BaseController } from "./BaseController";
import { InjectableTypes } from "../lib/injectableTypes";
import { inject } from "inversify";
import { Logger } from "../lib/Logger";
import { OnboardType, ORG, REPO, SDK } from "../lib/common";
import { CodeGenerationStatus } from "../lib/CodeGenerationModel";
// import { Logger } from "winston";

@controller("/codegenerate")
// export class CodeGenerateController extends BaseHttpController {
export class CodeGenerateController extends BaseController {
  constructor(@inject(InjectableTypes.Logger) protected logger: Logger) {
    super(logger);
  }
  /* generate an pull request. */
  @httpPost("/generatePullRequest")
  public async GenerateCodePullRequest(request: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const org = request.body.org;
    const repo = request.body.repo;
    const title = request.body.title;
    const branch = request.body.branch;
    const basebranch = request.body.base;
    console.log(
      "org:" +
        org +
        ",repo:" +
        repo +
        ",title:" +
        title +
        ",branch:" +
        branch +
        ",base:" +
        basebranch
    );

    const { prlink, err } = await CodeGenerateHandler.GenerateCodeRullRequest(
      PipelineCredential.token,
      org,
      repo,
      title,
      branch,
      basebranch
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
    } else {
      statusCode = 200;
      content = prlink;
    }

    return this.json(content, statusCode);
  }

  /*generate source code. */
  @httpPost("/resourceProvider/:rpname/sdk/:sdk/generate")
  public async GenerateSDK(request: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const rp = request.params.rpname;
    const sdk: string = request.params.sdk;
    const resources: string = request.params.resources;

    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
    }

    let codegenrepo: string = request.body.codegenrepo;
    if (codegenrepo === undefined) {
      codegenrepo = REPO.DEPTH_COVERAGE_REPO;
    }

    let type = request.body.type;
    if (type === undefined) {
      type = OnboardType.ADHOC_ONBOARD;
    }

    const platform = request.body.platform;
    let branch = "main";
    if (platform !== undefined && platform.toLowerCase() === "dev") {
      branch = "dev";
      type = "dev";
    }

    let { codegen: cg, err: getErr } = await getCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      type
    );

    if (
      getErr === undefined &&
      cg !== undefined &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      this.logger.info(
        "The code generation pipeline(" +
          rp +
          "," +
          sdk +
          ") is under " +
          cg.status +
          "Already. Ignore this trigger."
      );
      return this.json("Aleady Exists.", 201);
    }

    // const err = await CodeGenerateHandler.TriggerCodeGeneration(PipelineCredential.token, codegenorg, repo, branch, rp, sdk, type);
    let readmefile: string = "";
    let rs: ResourceAndOperation = new ResourceAndOperation(
      rp,
      readmefile,
      [],
      sdk,
      type
    );
    rs.generateResourceList();
    if (resources !== undefined) rs.resourcelist = resources;

    const err = await CodeGenerateHandler.TriggerCodeGeneration(
      PipelineCredential.token,
      codegenorg,
      codegenrepo,
      branch,
      rs
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to trigger code generation for " + rp + "sdk:" + sdk,
        err
      );
    } else {
      statusCode = 200;
      content = "Trigger " + type + " for resource provider " + rp;
      this.logger.info("Trigger " + type + " for resource provider " + rp);
    }

    return this.json(content, statusCode);
  }

  /*complete one code generation after all the code have been merged. */
  @httpPost("/resourceProvider/:rpname/sdk/:sdk/complete")
  public async CompleteCodeGenerationPOST(
    request: Request
  ): Promise<JsonResult> {
    const rp = request.params.rpname;
    const sdk: string = request.params.sdk;

    let onbaordtype = request.body.type;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.ADHOC_ONBOARD;
    }

    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
    }

    let sdkorg: string = request.body.org;
    let swaggerorg: string = request.body.swaggerorg;
    if (sdkorg === undefined) {
      sdkorg = ORG.AZURE;
      if (sdk.toLowerCase() === SDK.TF_SDK) {
        sdkorg = ORG.MS;
      }
    }
    if (swaggerorg === undefined) {
      swaggerorg = ORG.AZURE;
    }

    const err = await CodeGenerateHandler.CompleteCodeGeneration(
      PipelineCredential.token,
      rp,
      sdk,
      onbaordtype,
      codegenorg,
      sdkorg,
      swaggerorg
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to complete code generation for " + rp + "sdk:" + sdk,
        err
      );
    } else {
      statusCode = 200;
      content = "Complete " + onbaordtype + " for resource provider " + rp;
      this.logger.info(
        "Complete " + onbaordtype + " for resource provider " + rp
      );
    }

    return this.json(content, statusCode);
  }

  /*cancel one code generation. */
  @httpPost("/resourceProvider/:rpname/sdk/:sdk/cancel")
  public async CancelCodeGenerationPOST(request: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const rp = request.params.rpname;
    const sdk: string = request.params.sdk;

    let onbaordtype = request.body.type;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.ADHOC_ONBOARD;
    }

    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
    }

    let sdkorg: string = request.body.org;
    let swaggerorg: string = request.body.swaggerorg;
    if (sdkorg === undefined) {
      sdkorg = ORG.AZURE;
      if (sdk.toLowerCase() === SDK.TF_SDK) {
        sdkorg = ORG.MS;
      }
    }
    if (swaggerorg === undefined) {
      swaggerorg = ORG.AZURE;
    }

    const err = await CodeGenerateHandler.CancelCodeGeneration(
      PipelineCredential.token,
      rp,
      sdk,
      onbaordtype,
      codegenorg,
      sdkorg,
      swaggerorg
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to cancel code generation for " + rp + "sdk:" + sdk,
        err
      );
    } else {
      statusCode = 200;
      content = "Cancel " + onbaordtype + " for resource provider " + rp;
      this.logger.info(
        "Cancel " + onbaordtype + " for resource provider " + rp
      );
    }

    return this.json(content, statusCode);
  }

  /*generate code snipper. */
  @httpPost("/resourceProvider/:rpname/sdk/:sdk/codeSnipper")
  public async GenerateCodeSnipperPOST(request: Request) {
    return this.json("Not Implemented", 200);
  }

  /*onboard one codegeneration, submit generated code to sdk repo and readme to swagger repo. */
  @httpPost("/resourceProvider/:rpname/sdk/:sdk/onboard")
  public async OnboardCodeGenerationPOST(
    request: Request
  ): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const rp = request.params.rpname;
    const sdk: string = request.params.sdk;

    let onbaordtype = request.body.type;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.ADHOC_ONBOARD;
    }

    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
    }

    let sdkorg: string = request.body.org;
    let swaggerorg: string = request.body.swaggerorg;
    if (sdkorg === undefined) {
      sdkorg = ORG.AZURE;
      if (sdk.toLowerCase() === SDK.TF_SDK) {
        sdkorg = ORG.MS;
      }
    }
    if (swaggerorg === undefined) {
      swaggerorg = ORG.AZURE;
    }
    const err = await CodeGenerateHandler.SubmitGeneratedCode(
      rp,
      sdk,
      PipelineCredential.token,
      swaggerorg,
      sdkorg,
      onbaordtype
    );

    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to onboard " + sdk + " for resource provider " + rp,
        err
      );
    } else {
      statusCode = 200;
      content = "Onboard " + onbaordtype + " for resource provider " + rp;
      this.logger.info("onboard " + sdk + " for resource provider " + rp);
    }

    return this.json(content, statusCode);
  }

  /*customize an code generation. */
  @httpPost("/resourceProvider/:rpname/sdk/:sdk/customize")
  public async CustomizeCodegenerationPOST(
    request: Request
  ): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const rp = request.params.rpname;
    const sdk = request.params.sdk;
    const org = request.body.org as string;
    const triggerPR = request.body.triggerPR as string;
    const codePR = request.body.codePR as string;
    let excludeTest: boolean = false;
    if (request.query.excludeTest !== undefined) {
      excludeTest = Boolean(request.body.excludeTest);
    }
    let onbaordtype = request.body.type;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.ADHOC_ONBOARD;
    }

    let { codegen, err } = await getCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      onbaordtype
    );

    if (err === undefined || codegen === undefined) {
      this.logger.info(
        "No code generation pipeline for " +
          sdk +
          " of resource provider " +
          rp +
          ". No customize triggered."
      );
      return this.json(
        "No available code generation to trigger customize.",
        400
      );
    } else if (
      codegen.status ===
        CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
      codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS
    ) {
      this.logger.info(
        "The code generation pipeline(" +
          rp +
          "," +
          sdk +
          ") is under " +
          codegen.status +
          ". No avaialbe to trigger customize now."
      );
      return this.json("No available to trigger customize now", 400);
    } else if (
      codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      this.logger.info(
        "The code generation pipeline(" +
          rp +
          "," +
          sdk +
          ") is cancelled. No avaialbe to trigger customize now."
      );
      return this.json(
        "The code generation pipeline is cancelled. Cannot customize.",
        400
      );
    } else if (
      codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING
    ) {
      this.logger.info(
        "The code generation pipeline(" +
          rp +
          "," +
          sdk +
          ") is under " +
          codegen.status +
          "Already. Ignore this trigger."
      );
      return this.json(
        "customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=" +
          codegen.pipelineBuildID,
        201
      );
    }
    const custmizeerr = await CodeGenerateHandler.CustomizeCodeGeneration(
      PipelineCredential.token,
      rp,
      sdk,
      onbaordtype,
      triggerPR,
      codePR,
      org,
      excludeTest
    );

    if (custmizeerr !== undefined) {
      this.logger.error(
        "Failed to customize resource provider " + rp + ", sdk:" + sdk,
        err
      );
      return this.json({ error: custmizeerr }, 400);
    } else {
      this.logger.info("Customize resource provider " + rp + ", sdk:" + sdk);
      return this.json(
        "customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=" +
          codegen.pipelineBuildID,
        201
      );
    }
  }
}
