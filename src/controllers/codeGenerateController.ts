import {
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
} from "inversify-express-utils";
import { JsonResult } from "inversify-express-utils/dts/results";
import { Request } from "express";
import CodeGenerateHandler from "../lib/CodeGenerateHandler";
import { PipelineCredential } from "../lib/pipeline/PipelineCredential";
import { ResourceAndOperation } from "../lib/Model";
import { BaseController } from "./BaseController";
import { InjectableTypes } from "../lib/injectableTypes";
import { inject } from "inversify";
import { Logger } from "../lib/Logger";
import {
  CodeGenerationStatus,
  RepoInfo,
  SDKCodeGeneration,
  SDKCodeGenerationDetailInfo,
} from "../lib/CodeGenerationModel";
import { CodegenDBCredentials } from "../lib/sqldb/DBCredentials";
import { config, getGitRepoInfo } from "../config";
import CodeGenerationTable from "../lib/sqldb/CodeGenerationTable";
import { CodeGenerationType } from "../lib/common";
import { CodegenPipelineBuildResultsCollection } from "../Logger/mongo/CodegenPipelineBuildResultsCollection";
import { CodegenPipelineTaskResult } from "../Logger/PipelineTask";
import { environmentConfigDev } from "../config/dev";
// import { Logger } from "winston";

@controller("/codegenerations")
// export class CodeGenerateController extends BaseHttpController {
export class CodeGenerateController extends BaseController {
  constructor(
    @inject(InjectableTypes.Logger) protected logger: Logger,
    @inject(InjectableTypes.PipelineResultCol)
    protected pipelineResultCol: CodegenPipelineBuildResultsCollection
  ) {
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

  /*******************SDK Code Generation Rest API **********************/
  /*generate source code. */
  @httpPut("/:codegenname")
  public async CreateSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    const rp = request.body.resourceProvider;
    const sdk: string = request.body.sdk;
    const resources: string = request.body.resources;
    const platform = request.body.platform;
    const stype = request.body.serviceType;
    const tag = request.body.tag;
    const commit = request.body.commit;
    const owners = request.body.contactAliases;

    let codegenRepo: RepoInfo = undefined;
    if (request.body.codegenRepo !== undefined) {
      codegenRepo = request.body.codegenRepo as RepoInfo;
      codegenRepo.path = codegenRepo.path.replace(".git", "");
    } else {
      if (platform !== undefined && platform.toLowerCase() === "dev") {
        codegenRepo = environmentConfigDev.defaultCodegenRepo;
      } else {
        codegenRepo = config.defaultCodegenRepo;
      }
    }

    let swaggerRepo: RepoInfo = undefined;
    if (request.body.swaggerRepo !== undefined) {
      swaggerRepo = request.body.swaggerRepo as RepoInfo;
      swaggerRepo.path = swaggerRepo.path.replace(".git", "");
    } else {
      if (platform !== undefined && platform.toLowerCase() === "dev") {
        swaggerRepo = environmentConfigDev.defaultSwaggerRepo;
      } else {
        swaggerRepo = config.defaultSwaggerRepo;
      }
    }

    let sdkRepo: RepoInfo = undefined;
    if (request.body.sdkRepo !== undefined) {
      sdkRepo = request.body.sdkRepo as RepoInfo;
      sdkRepo.path = sdkRepo.path.replace(".git", "");
    } else {
      if (platform !== undefined && platform.toLowerCase() === "dev") {
        sdkRepo = environmentConfigDev.defaultSDKRepos[sdk];
      } else {
        sdkRepo = config.defaultSDKRepos[sdk];
      }
    }

    let type = request.body.type;
    if (type === undefined) {
      type = CodeGenerationType.ADHOC;
    }

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
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
      return this.json(
        { error: "Aleady Exists.", message: "Already Exists" },
        400
      );
    }

    // const err = await CodeGenerateHandler.TriggerCodeGeneration(PipelineCredential.token, codegenorg, repo, branch, rp, sdk, type);
    let readmefile: string =
      "/specification/" + rp + "/resource-manager/readme.md";
    let rs: ResourceAndOperation = new ResourceAndOperation(
      rp,
      readmefile,
      [],
      sdk,
      type,
      stype,
      swaggerRepo,
      codegenRepo,
      sdkRepo,
      commit
    );
    if (tag !== undefined) rs.tag = tag;
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
      codegenRepo.branch,
      rs,
      owners !== undefined ? owners.join(";") : ""
    );
    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err, message: "" };
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

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json({ error: "Not Exist."}, 400);
    }

    return this.json(cg, 200);
  }

  /* update sdk code generation. */
  @httpPatch("/:codegenname")
  public async UpdateSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json({ error: "Not Exist." }, 400);
    }

    const values = request.body.updateParameters;
    const ret = await CodeGenerationTable.UpdateSDKCodeGenerationValues(
      CodegenDBCredentials,
      cg.name,
      values
    );

    let content = {};
    let statusCode = 200;
    if (ret !== undefined) {
      statusCode = 400;
      content = { error: ret };
      this.logger.error(
        "Failed to update code generation " +
          name +
          " for " +
          cg.resourceProvider +
          " sdk:" +
          cg.sdk,
        ret
      );
    } else {
      statusCode = 200;
      // content =
      //   "Updated code generation " +
      //   name +
      //   " for " +
      //   cg.resourceProvider +
      //   " sdk:" +
      //   cg.sdk;
      let {
        codegen: cg
      } = await CodeGenerationTable.getSDKCodeGenerationByName(
        CodegenDBCredentials,
        name
      );
      content = cg;
      this.logger.info(
        "Updated code generation " +
          name +
          " for " +
          cg.resourceProvider +
          " sdk:" +
          cg.sdk
      );
    }

    return this.json(content, statusCode);
  }
  /* delete sdk code generation. */
  @httpDelete("/:codegenname")
  public async DeleteSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json({ error: "Not Exist." }, 400);
    }

    const err = await CodeGenerateHandler.DeleteSDKCodeGeneration(
      PipelineCredential.token,
      name
    );

    return this.json("OK", 200);
  }

  // ClearSDKCodeGenerationWorkSpace(token: any, rp: any, sdk: any, type: any, codegenrepo: any, sdk_repo: any, swagger_repo: any, branch: any) {
  //   throw new Error("Method not implemented.");
  // }

  /* get sdk code generation detail information. */
  @httpGet("/:codegenname/detail")
  public async GetSDKCodeGenerationDetailInfo(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json({ error: "Not Exist." }, 400);
    }

    const pipelineid: string = cg.lastPipelineBuildID;
    const taskResults: CodegenPipelineTaskResult[] = await this.pipelineResultCol.getFromBuild(
      pipelineid
    );
    let cginfo: SDKCodeGenerationDetailInfo = new SDKCodeGenerationDetailInfo(
      cg.name,
      cg.resourceProvider,
      cg.serviceType,
      cg.resourcesToGenerate,
      cg.tag,
      cg.sdk,
      cg.swaggerRepo,
      cg.sdkRepo,
      cg.codegenRepo,
      cg.owner,
      cg.type,
      cg.swaggerPR,
      cg.codePR,
      cg.lastPipelineBuildID,
      cg.status,
      taskResults
    );

    return this.json(cginfo, 200);
  }

  /* list sdk code generations. */
  @httpGet("/")
  public async ListALLSDKCodeGenerations(
    request: Request
  ): Promise<JsonResult> {
    let filters = request.query;
    const codegens: SDKCodeGeneration[] = await CodeGenerationTable.ListSDKCodeGenerations(
      CodegenDBCredentials,
      filters,
      false
    );

    return this.json(codegens, 200);
  }

  /*complete one code generation after all the code have been merged. */
  @httpPost("/:codegenname/complete")
  public async CompleteSDKCodeGeneration(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info("The code generation (" + name + ") does not exist.");
      return this.json({ error: "Not Exist." }, 400);
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
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
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

  /*run one code generation. */
  @httpPost("/:codegenname/run")
  public async RunCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info(
        "code generation " + name + " does not exist. No run triggered."
      );
      return this.json("Not Exist.", 400);
    } else if (
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS ||
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      this.logger.info(
        "The code generation " +
          name +
          "(" +
          cg.resourceProvider +
          "," +
          cg.sdk +
          ") is under " +
          cg.status +
          ". No avaialbe to run now."
      );
      return this.json({ error: "Not available to run now" }, 400);
    }

    const err = await CodeGenerateHandler.RunSDKCodeGeneration(
      PipelineCredential.token,
      name
    );

    if (err !== undefined) {
      this.logger.error(
        "Failed to run code generation '" +
          name +
          "'( " +
          cg.resourceProvider +
          ", " +
          cg.sdk +
          ").",
        err
      );
      return this.json({ error: err }, 400);
    } else {
      this.logger.info(
        "Succeeded to run code generation '" +
          name +
          "'( " +
          cg.resourceProvider +
          ", " +
          cg.sdk +
          ")."
      );
      return this.json("OK", 200);
    }
  }

  /* customize the code generation. */
  @httpPost("/:codegenname/customize")
  public async CustomizeSDKCodeGeneration(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;
    const triggerPR = request.body.triggerPR as string;
    const codePR = request.body.codePR as string;

    let excludeTest: boolean = false;
    if (request.query.excludeTest !== undefined) {
      excludeTest = Boolean(request.query.excludeTest);
    }

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info(
        "code generation " + name + " does not exist. No customize triggered."
      );
      return this.json(
        { error: "No available code generation to trigger customize." },
        400
      );
    } else if (
      // cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS ||
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      this.logger.info(
        "The code generation " +
          name +
          "(" +
          cg.resourceProvider +
          "," +
          cg.sdk +
          ") is under " +
          cg.status +
          ". Not avaialbe to trigger customize now."
      );
      return this.json(
        { error: "Not available to trigger customize now" },
        400
      );
    } else if (
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING
    ) {
      this.logger.info(
        "The code generation " +
          name +
          "(" +
          cg.resourceProvider +
          "," +
          cg.sdk +
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
        "Failed to customize code generation '" +
          name +
          "'( " +
          cg.resourceProvider +
          ", " +
          cg.sdk +
          ").",
        custmizeerr
      );
      return this.json({ error: custmizeerr }, 400);
    } else {
      this.logger.info(
        "Succeeded to customize code generation '" +
          name +
          "'( " +
          cg.resourceProvider +
          ", " +
          cg.sdk +
          ")."
      );
      return this.json(
        "customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=" +
          cg.lastPipelineBuildID,
        200
      );
    }
  }

  /* customize the code generation. */
  @httpGet("/:codegenname/customize")
  public async CustomizeSDKCodeGenerationGet(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;
    const triggerPR = request.body.triggerPR as string;
    const codePR = request.body.codePR as string;

    let excludeTest: boolean = false;
    if (request.query.excludeTest !== undefined) {
      excludeTest = Boolean(request.query.excludeTest);
    }

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info(
        "code generation " + name + " does not exist. No customize triggered."
      );
      return this.json(
        { error: "No available code generation to trigger customize." },
        400
      );
    } else if (
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS ||
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      this.logger.info(
        "The code generation " +
          name +
          "(" +
          cg.resourceProvider +
          "," +
          cg.sdk +
          ") is under " +
          cg.status +
          ". Not avaialbe to trigger customize now."
      );
      return this.json(
        { error: "Not available to trigger customize now" },
        400
      );
    } else if (
      cg.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING
    ) {
      this.logger.info(
        "The code generation " +
          name +
          "(" +
          cg.resourceProvider +
          "," +
          cg.sdk +
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
        "Failed to customize code generation '" +
          name +
          "'( " +
          cg.resourceProvider +
          ", " +
          cg.sdk +
          ").",
        custmizeerr
      );
      return this.json({ error: custmizeerr }, 400);
    } else {
      this.logger.info(
        "Succeeded to customize code generation '" +
          name +
          "'( " +
          cg.resourceProvider +
          ", " +
          cg.sdk +
          ")."
      );
      return this.json(
        "customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=" +
          cg.lastPipelineBuildID,
        201
      );
    }
  }

  /*onboard one codegeneration, submit generated code to sdk repo and readme to swagger repo. */
  @httpPost("/:codegenname/onboard")
  public async OnboardSDKCodeGeneration(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info(
        "code generation " + name + " does not exist. No onboard triggered."
      );
      return this.json(
        { error: "No available code generation to onboard." },
        400
      );
    }

    const err = await CodeGenerateHandler.SubmitGeneratedSDKCode(
      PipelineCredential.token,
      name
    );

    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to onboard " +
          name +
          "(" +
          cg.sdk +
          ", " +
          cg.resourceProvider +
          ").",
        err
      );
    } else {
      statusCode = 200;
      (content =
        "Succeed to onboard " +
        name +
        "(" +
        cg.sdk +
        ", " +
        cg.resourceProvider +
        ")."),
        this.logger.info(content);
    }

    return this.json(content, statusCode);
  }

  /*onboard one codegeneration, submit generated code to sdk repo and readme to swagger repo. */
  @httpGet("/:codegenname/onboard")
  public async OnboardSDKCodeGenerationGet(
    request: Request
  ): Promise<JsonResult> {
    const name = request.params.codegenname;

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      this.logger.info(
        "code generation " + name + " does not exist. No onboard triggered."
      );
      return this.json(
        { error: "No available code generation to onboard." },
        400
      );
    }

    const err = await CodeGenerateHandler.SubmitGeneratedSDKCode(
      PipelineCredential.token,
      name
    );

    let content = {};
    let statusCode = 200;
    if (err !== undefined) {
      statusCode = 400;
      content = { error: err };
      this.logger.error(
        "Failed to onboard " +
          name +
          "(" +
          cg.sdk +
          ", " +
          cg.resourceProvider +
          ").",
        err
      );
    } else {
      statusCode = 200;
      (content =
        "Succeed to onboard " +
        name +
        "(" +
        cg.sdk +
        ", " +
        cg.resourceProvider +
        ")."),
        this.logger.info(content);
    }

    return this.json(content, statusCode);
  }
  /*generate code snipper. */
  @httpPost("/codeSnipper")
  public async GenerateSDKCodeSnipper(request: Request) {
    return this.json("Not Implemented", 200);
  }

  /* submit pipeline result to cosmosdb. */
  @httpPost("/:codegenname/taskResult")
  public async PublishPipelineResult(request: Request): Promise<JsonResult> {
    const name = request.params.codegenname;
    const buildId: string = request.body.pipelineBuildId;
    const result: CodegenPipelineTaskResult = request.body.taskResult;
    await this.pipelineResultCol.put(buildId, result);

    return undefined;
  }
}
