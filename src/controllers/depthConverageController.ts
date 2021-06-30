import {
  httpGet,
  controller,
  httpPost,
  BaseHttpController,
  httpPut,
} from "inversify-express-utils";
import { check } from "express-validator/check";
import { IngestCandidates } from "../lib/CandidateService";
import { Request, Response, response } from "express";
import { JsonResult } from "inversify-express-utils/dts/results";
import {
  ListCodeGenerations,
  getAvailableCodeGeneration,
} from "../lib/CodeGeneration";
import { OnboardType, ORG, SDK } from "../lib/common";
import CodeGenerateHandler from "../lib/CodeGenerateHandler";
import DepthCoverageHandler from "../lib/DepthCoverageHandler";
import { CodegenDBCredentials, DepthDBCredentials } from "../lib/DBCredentials";
import { ENVKEY } from "../lib/Model";
import {
  CodeGeneration,
  CodeGenerationStatus,
  CodeGenerationDBColumn,
} from "../lib/CodeGenerationModel";
import { PipelineCredential } from "../lib/pipeline/PipelineCredential";
import { BaseController } from "./BaseController";
import { InjectableTypes } from "../lib/injectableTypes";
import { inject } from "inversify";
import { Logger } from "../lib/Logger";
// import { JsonResult } from "inversify-express-utils/dts/results/index"

@controller("/depthCoverage")
// export class DepthCoverageController extends BaseHttpController {
export class DepthCoverageController extends BaseController {
  constructor(@inject(InjectableTypes.Logger) protected logger: Logger) {
    super(logger);
  }
  // public token: string = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
  // public constructor(tk: string = undefined) {
  //     super();
  //     if (tk !== undefined) this.token = tk;
  // }
  @httpGet("/")
  public hello(): string {
    this.logger.info(DepthDBCredentials.server);
    this.logger.info("welcome");
    return "HelloWorld";
  }

  /*ingest depth-coverage candidates. */
  @httpPut("/sdk/:sdk/candidates", check("request").exists())
  public async Candidates(request: Request): Promise<JsonResult> {
    // let res: Response = new Response();
    const dbserver = process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
    const db = process.env[ENVKEY.ENV_DEPTH_DATABASE];
    const dbuser = process.env[ENVKEY.ENV_DEPTH_DB_USER];
    const dbpw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
    const sdk = request.params.sdk;
    console.log("sdk:" + sdk);
    if (!dbserver || !db || !dbuser || !dbpw) {
      //throw new Error("Missing required parameter");
      return this.json({ error: "Missing required parameter" }, 400);
    }
    let candidates = request.body.candidates;
    //let table = req.body.table;
    const err = await IngestCandidates(
      candidates,
      dbserver,
      db,
      dbuser,
      dbpw,
      sdk
    );

    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error("Failed to ingest candidates.", err);
    } else {
      statusCode = 200;
      content = "ingest candidate";
      this.logger.info("Ingest " + sdk + " candidates.");
    }
    return this.json(content, statusCode);
  }

  /*trigger depth-coverage. */
  @httpPost("/trigger")
  public async Trigger(req: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    /* The code gen pipeline org. */
    let org = req.body.org;
    if (org === undefined) {
      org = ORG.AZURE;
    }
    const repo = req.body.repo;
    // const dbserver=process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
    // const db=process.env[ENVKEY.ENV_DEPTH_DATABASE];
    // const dbuser = process.env[ENVKEY.ENV_DEPTH_DB_USER];
    // const dbpw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
    const candidate = req.body.candidateResources;
    const platform = req.body.platform;
    let branch = "main";
    let type = "depth";
    if (platform !== undefined && platform.toLowerCase() === "dev") {
      branch = "dev";
      // type = "dev";
    }
    // if (
    //     !dbserver ||
    //     !db ||
    //     !dbuser ||
    //     !dbpw
    // ) {
    //     throw new Error("Missing required parameter");
    // }
    console.log(org + "," + repo);
    const err = await DepthCoverageHandler.TriggerOnboard(
      DepthDBCredentials.server,
      DepthDBCredentials.db,
      DepthDBCredentials.user,
      DepthDBCredentials.pw,
      PipelineCredential.token,
      org,
      repo,
      branch,
      candidate,
      type
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error("Failed to trigger depthcoverage.", err);
    } else {
      statusCode = 200;
      content = "OK";
      this.logger.info("Trigger depthcoverage.");
    }
    return this.json(content, statusCode);
  }

  /*complete an resource provider pipeline for a sdk. */
  @httpPost(
    "/resourceProvider/:rpname/sdk/:sdk/complete",
    check("request").exists()
  )
  public async Complete(request: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const org = ORG.AZURE;
    const rp = request.params.rpname;
    const sdk: string = request.params.sdk;
    let sdkorg: string = request.body.org;
    if (sdkorg === undefined) {
      sdkorg = ORG.AZURE;
      if (sdk.toLowerCase() === SDK.TF_SDK) {
        sdkorg = ORG.MS;
      }
    }

    let swaggerorg: string = request.body.swaggerorg;
    if (swaggerorg === undefined) {
      swaggerorg = ORG.AZURE;
    }

    const onbaordtype: string = OnboardType.DEPTH_COVERAGE;
    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
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
        "Failed to Complete " + onbaordtype + " for resource provider " + rp,
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

  /* cancel a depth-coverge generation. */
  @httpPost(
    "/resourceProvider/:rpname/sdk/:sdk/cancel",
    check("request").exists()
  )
  public async CancelDepthCoverage(request: Request): Promise<JsonResult> {
    const org = ORG.AZURE;
    const rp = request.params.rpname;
    const sdk: string = request.params.sdk;
    let sdkorg: string = request.body.sdkorg;
    if (sdkorg === undefined) {
      sdkorg = ORG.AZURE;
      if (sdk.toLowerCase() === SDK.TF_SDK) {
        sdkorg = ORG.MS;
      }
    }

    let swaggerorg: string = request.body.swaggerorg;
    if (swaggerorg === undefined) {
      swaggerorg = ORG.AZURE;
    }

    const onbaordtype: string = OnboardType.DEPTH_COVERAGE;
    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
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
        "Failed to Cancel " + onbaordtype + " for resource provider " + rp,
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

  /* cancel all depth-coverages. */
  @httpPost("/cancel")
  public async CancelAllDepthCoverages(request: Request): Promise<JsonResult> {
    let canceledCodegens: string[] = [];
    let failedCodegens: string[] = [];
    let codegenorg: string = request.body.codegenorg;
    if (codegenorg === undefined) {
      codegenorg = ORG.AZURE;
    }

    let sdkorg: string = request.body.org;
    let swaggerorg: string = request.body.swaggerorg;

    if (swaggerorg === undefined) {
      swaggerorg = ORG.AZURE;
    }

    const type = OnboardType.DEPTH_COVERAGE;
    const codegens: CodeGeneration[] = await ListCodeGenerations(
      CodegenDBCredentials.server,
      CodegenDBCredentials.db,
      CodegenDBCredentials.user,
      CodegenDBCredentials.pw,
      type,
      true
    );

    for (let codegen of codegens) {
      if (sdkorg === undefined) {
        sdkorg = ORG.AZURE;
        if (codegen.sdk.toLowerCase() === SDK.TF_SDK) {
          sdkorg = ORG.MS;
        }
      }
      const err = await CodeGenerateHandler.CancelCodeGeneration(
        PipelineCredential.token,
        codegen.resourceProvider,
        codegen.sdk,
        type,
        codegenorg,
        sdkorg,
        swaggerorg
      );
      let content = "(" + codegen.resourceProvider + "," + codegen.sdk + ")";
      if (err !== undefined) {
        failedCodegens.push(content);
      } else {
        canceledCodegens.push(content);
      }
    }

    let ret = {
      cancelled: canceledCodegens.join(";"),
      failed: failedCodegens.join(";"),
    };

    this.logger.info("Cancel all depthcoverage.");
    return this.json(ret, 200);
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

    this.logger.info("Generate pull request.");
    return this.json(content, statusCode);
  }

  /*Onboard an resource provider. */
  @httpGet("/resourceProvider/:rpname/sdk/:sdk/onboard")
  public async OnboardResourceProvider(request: Request): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const swaggerorg = request.query.swaggerorg;
    const org = request.query.org;
    const rp = request.params.rpname;
    const sdk = request.params.sdk;

    let err = await CodeGenerateHandler.SubmitGeneratedCode(
      rp,
      sdk,
      PipelineCredential.token,
      swaggerorg as string,
      org as string
    );

    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error("Failed to onboard resource provider " + rp, err);
    } else {
      statusCode = 200;
      content = rp + " onboarded";
      this.logger.info("onboard resource provider " + rp);
    }

    return this.json(content, statusCode);
  }

  @httpPost("/resourceProvider/:rpname/sdk/:sdk/onboard")
  public async OnboardResourceProviderPOST(
    request: Request
  ): Promise<JsonResult> {
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const swaggerorg = request.body.swaggerorg;
    const org = request.body.org;
    const rp = request.params.rpname;
    const sdk = request.params.sdk;

    let err = await CodeGenerateHandler.SubmitGeneratedCode(
      rp,
      sdk,
      PipelineCredential.token,
      swaggerorg,
      org
    );

    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error("Failed to onboard resource provider " + rp, err);
    } else {
      statusCode = 200;
      content = rp + " onboarded";
      this.logger.info("onboard resource provider " + rp);
    }

    return this.json(content, statusCode);
  }

  @httpGet("/resourceProvider/:rpname/sdk/:sdk/customize")
  public async CustomizeResourceProviderGeneration(
    request: Request
  ): Promise<JsonResult> {
    const org = request.query.org as string;
    // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    const rp = request.params.rpname;
    const sdk = request.params.sdk;
    const triggerPR = request.query.triggerPR as string;
    const codePR = request.query.codePR as string;
    let excludeTest: boolean = false;
    if (request.query.excludeTest !== undefined) {
      excludeTest = Boolean(request.query.excludeTest);
    }

    const onbaordtype: string = OnboardType.DEPTH_COVERAGE;
    let { codegen, err } = await getAvailableCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      "depth"
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

  @httpPost("/resourceProvider/:rpname/sdk/:sdk/customize")
  public async CustomizeResourceProviderGenerationPOST(
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

    const onbaordtype: string = OnboardType.DEPTH_COVERAGE;

    let { codegen, err } = await getAvailableCodeGeneration(
      process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
      process.env[ENVKEY.ENV_CODEGEN_DATABASE],
      process.env[ENVKEY.ENV_CODEGEN_DB_USER],
      process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
      rp,
      sdk,
      "depth"
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
