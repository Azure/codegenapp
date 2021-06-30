import {
  BaseHttpController,
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
} from "inversify-express-utils";
import { JsonResult } from "inversify-express-utils/dts/results";
import { Request, Response, response } from "express";
import {
  getAvailableCodeGeneration,
  getCodeGeneration,
  getSDKCodeGenerationByName,
  ListCodeGenerations,
  ListSDKCodeGenerations,
  UpdateCodeGenerationValue,
  UpdateSDKCodeGenerationValues,
} from "../lib/CodeGeneration";
import CodeGenerateHandler from "../lib/CodeGenerateHandler";
import { PipelineCredential } from "../lib/pipeline/PipelineCredential";
import { ENVKEY, ResourceAndOperation } from "../lib/Model";
import { BaseController } from "./BaseController";
import { InjectableTypes } from "../lib/injectableTypes";
import { inject } from "inversify";
import { Logger } from "../lib/Logger";
import { OnboardType, ORG, REPO, SDK } from "../lib/common";
import {
  CodeGeneration,
  CodeGenerationStatus,
  RepoInfo,
  SDKCodeGeneration,
} from "../lib/CodeGenerationModel";
import { CodegenDBCredentials, DepthDBCredentials } from "../lib/DBCredentials";
import { default_codegen_repo, getGitRepoInfo } from "../config";
// import { Logger } from "winston";

@controller("/codegenerations")
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

    let onboardtype = request.body.onboardtype;
    if (onboardtype === undefined) {
      onboardtype = OnboardType.ADHOC;
    }

    const platform = request.body.platform;
    let branch = "main";
    if (platform !== undefined && platform.toLowerCase() === "dev") {
      branch = "dev";
      // onboardtype = "dev";
    }

    let { codegen: cg, err: getErr } = await getCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      onboardtype
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
          " Already. Ignore this trigger."
      );
      return this.json("Aleady Exists.", 201);
    }

    // const err = await CodeGenerateHandler.TriggerCodeGeneration(PipelineCredential.token, codegenorg, repo, branch, rp, sdk, type);
    let readmefile: string =
      "/specification/" + rp + "/resource-manager/readme.md";
    let rs: ResourceAndOperation = new ResourceAndOperation(
      rp,
      readmefile,
      [],
      sdk,
      onboardtype
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
        "Failed to trigger code generation for " + rp + " sdk:" + sdk,
        err
      );
    } else {
      statusCode = 200;
      content = "Trigger " + onboardtype + " for resource provider " + rp;
      this.logger.info(
        "Trigger " + onboardtype + " for resource provider " + rp
      );
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
      onbaordtype = OnboardType.ADHOC;
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
      onbaordtype = OnboardType.ADHOC;
    }

    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
    }

    let sdkorg: string = request.body.sdkorg;
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
        "Failed to cancel code generation for " + rp + ",sdk:" + sdk,
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
      onbaordtype = OnboardType.ADHOC;
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
      onbaordtype = OnboardType.ADHOC;
    }

    let { codegen, err } = await getAvailableCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      onbaordtype
    );

    if (err !== undefined || codegen === undefined) {
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

  /*customize an code generation. */
  @httpGet("/resourceProvider/:rpname/sdk/:sdk/customize")
  public async CustomizeCodegenerationGET(
    request: Request
  ): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const rp = request.params.rpname;
    const sdk = request.params.sdk;

    const org = request.query.org as string;
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];

    const triggerPR = request.query.triggerPR as string;
    const codePR = request.query.codePR as string;
    let excludeTest: boolean = false;
    if (request.query.excludeTest !== undefined) {
      excludeTest = Boolean(request.query.excludeTest);
    }

    let onbaordtype = request.query.type as string;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.DEV_ONBOARD;
    }

    let { codegen, err } = await getAvailableCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      onbaordtype
    );

    if (err !== undefined || codegen === undefined) {
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
        custmizeerr
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

  /* list code generations. */
  @httpPost("/list")
  public async ListCodeGenerationsPOST(request: Request): Promise<JsonResult> {
    let onbaordtype = request.body.onboardtype;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.ADHOC;
    }
    const codegens: CodeGeneration[] = await ListCodeGenerations(
      CodegenDBCredentials.server,
      CodegenDBCredentials.db,
      CodegenDBCredentials.user,
      CodegenDBCredentials.pw,
      onbaordtype,
      true
    );

    return this.json(codegens, 200);
  }

  /*******************SDK Code Generation Rest API **********************/
  /*generate source code. */
  @httpPut("/:codegenname")
  public async GenerateSDKCode(request: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const name = request.params.codegenname;
    // const rp = request.params.rpname;
    // const sdk: string = request.params.sdk;

    const rp = request.body.resourceProvider;
    const sdk: string = request.body.sdk;
    const resources: string = request.body.resources;

    let codegenRepo: RepoInfo = undefined;
    if (request.body.codegenRepo !== undefined) {
      codegenRepo = request.body.codegenRepo as RepoInfo;
    } else {
      codegenRepo = default_codegen_repo;
    }

    let type = request.body.type;
    if (type === undefined) {
      type = OnboardType.ADHOC;
    }

    const platform = request.body.platform;
    let branch = "main";
    if (platform !== undefined && platform.toLowerCase() === "dev") {
      branch = "dev";
      // onboardtype = "dev";
    }

    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
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
          " Already. Ignore this trigger."
      );
      return this.json("Aleady Exists.", 400);
    }

    // const err = await CodeGenerateHandler.TriggerCodeGeneration(PipelineCredential.token, codegenorg, repo, branch, rp, sdk, type);
    let readmefile: string =
      "/specification/" + rp + "/resource-manager/readme.md";
    let rs: ResourceAndOperation = new ResourceAndOperation(
      rp,
      readmefile,
      [],
      sdk,
      type
    );
    rs.generateResourceList();
    if (resources !== undefined) rs.resourcelist = resources;

    const { org: codegenorg, repo: codegenreponame } = getGitRepoInfo(
      codegenRepo
    );
    const err = await CodeGenerateHandler.CreateSDKCodeGeneration(
      name,
      PipelineCredential.token,
      codegenorg,
      codegenreponame,
      branch,
      rs
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to trigger code generation for " + rp + " sdk:" + sdk,
        err
      );
    } else {
      statusCode = 200;
      content = "Trigger " + type + " for resource provider " + rp;
      this.logger.info("Trigger " + type + " for resource provider " + rp);
    }

    return this.json(content, statusCode);
  }

  /* get sdk code generation. */
  @httpGet("/:codegenname")
  public async GetSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json("Not Exist.", 400);
    }

    return this.json(cg, 200);
  }

  /* update sdk code generation. */
  @httpPatch("/:codegenname")
  public async UpdateSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json("Not Exist.", 400);
    }

    const values = request.body.updateParameters;
    const ret = await UpdateSDKCodeGenerationValues(CodegenDBCredentials, cg.name, values);

    let content = {};
    let statusCode = 200;
    if (ret !== undefined) {
      statusCode = 400;
      content = { error: ret };
      this.logger.error(
        "Failed to update code generation " + name + " for " + cg.resourceProvider + " sdk:" + cg.sdk,
        ret
      );
    } else {
      statusCode = 200;
      content = "Updated code generation " + name + " for " + cg.resourceProvider + " sdk:" + cg.sdk;
      this.logger.info("Updated code generation " + name + " for " + cg.resourceProvider + " sdk:" + cg.sdk);
    }

    return this.json(content, statusCode);
  }
  /* delete sdk code generation. */
  @httpDelete("/:codegenname")
  public async DeleteSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json("Not Exist.", 400);
    }

    /* cancel the code gen. */
    /* remove from table. */
    return this.json("OK", 200);
  }

  /* get sdk code generation detail information. */
  @httpGet("/:codegenname/detail")
  public async GetSDKCodeGenerationDetailInfo(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json("Not Exist.", 400);
    }

    const status = cg.status;
    // if (cg.status === )
  }

  /* list sdk code generations. */
  @httpGet("/")
  public async ListALLSDKCodeGenerationsPOST(
    request: Request
  ): Promise<JsonResult> {
    let onbaordtype = request.body.onboardtype;
    if (onbaordtype === undefined) {
      onbaordtype = OnboardType.ADHOC;
    }
    const codegens: SDKCodeGeneration[] = await ListSDKCodeGenerations(
      CodegenDBCredentials,
      onbaordtype,
      true
    );

    return this.json(codegens, 200);
  }

  /*complete one code generation after all the code have been merged. */
  @httpPost("/:codegenname/complete")
  public async CompleteSDKCodeGeneration(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;
    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json("Not Exist.", 400);
    }

    const err = await CodeGenerateHandler.CompleteSDKCodeGeneration(
      PipelineCredential.token,
      name
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to complete code generation " +
          name +
          " for " +
          cg.resourceProvider +
          "sdk:" +
          cg.sdk,
        err
      );
    } else {
      statusCode = 200;
      content =
        "Complete " + name + " for resource provider " + cg.resourceProvider;
      this.logger.info(
        "Complete " + name + " for resource provider " + cg.resourceProvider
      );
    }

    return this.json(content, statusCode);
  }

  /*cancel one code generation. */
  @httpPost("/:codegenname/cancel")
  public async CancelSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;
    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json("Not Exist.", 400);
    }

    const err = await CodeGenerateHandler.CancelSDKCodeGeneration(
      PipelineCredential.token,
      name
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to cancel code generation " +
          name +
          " for " +
          cg.resourceProvider +
          ",sdk:" +
          cg.sdk,
        err
      );
    } else {
      statusCode = 200;
      content =
        "Cancel " + name + " for resource provider " + cg.resourceProvider;
      this.logger.info(
        "Cancel " + name + " for resource provider " + cg.resourceProvider
      );
    }

    return this.json(content, statusCode);
  }

  /* customize the code generation. */
  @httpPost("/:codegenname/customize")
  public async CustomizeSDKCodeGeneration(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;
    const rp = request.params.rpname;
    const sdk = request.params.sdk;
    const triggerPR = request.body.triggerPR as string;
    const codePR = request.body.codePR as string;

    let excludeTest: boolean = false;
    if (request.query.excludeTest !== undefined) {
      excludeTest = Boolean(request.query.excludeTest);
    }

    let { codegen: cg, err: getErr } = await getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
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
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS
    ) {
      this.logger.info(
        "The code generation pipeline(" +
          rp +
          "," +
          sdk +
          ") is under " +
          cg.status +
          ". No avaialbe to trigger customize now."
      );
      return this.json("No available to trigger customize now", 400);
    } else if (
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
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
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING
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
      return this.json(
        "customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=" +
          cg.lastPipelineBuildID,
        201
      );
    }
    const custmizeerr = await CodeGenerateHandler.CustomizeSDKCodeGeneration(
      PipelineCredential.token,
      name,
      triggerPR,
      codePR,
      excludeTest
    );

    if (custmizeerr !== undefined) {
      this.logger.error(
        "Failed to customize resource provider " + rp + ", sdk:" + sdk,
        custmizeerr
      );
      return this.json({ error: custmizeerr }, 400);
    } else {
      this.logger.info("Customize resource provider " + rp + ", sdk:" + sdk);
      return this.json(
        "customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=" +
          cg.lastPipelineBuildID,
        201
      );
    }
  }

  /*generate code snipper. */
  @httpPost("/codeSnipper")
  public async GenerateSDKCodeSnipper(request: Request) {
    return this.json("Not Implemented", 200);
  }
}
