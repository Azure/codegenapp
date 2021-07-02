import {
  httpGet,
  controller,
  httpPost,
  httpPut,
} from "inversify-express-utils";
import { check } from "express-validator/check";
import { Request } from "express";
import { JsonResult } from "inversify-express-utils/dts/results";
import DepthCoverageHandler from "../lib/DepthCoverageHandler";
import { DepthDBCredentials } from "../lib/sqldb/DBCredentials";
import { RepoInfo } from "../lib/CodeGenerationModel";
import { PipelineCredential } from "../lib/pipeline/PipelineCredential";
import { BaseController } from "./BaseController";
import { InjectableTypes } from "../lib/injectableTypes";
import { inject } from "inversify";
import { Logger } from "../lib/Logger";
import { default_codegen_repo } from "../config";
import DepthCandidateTable from "../lib/sqldb/DepthCandidateTable";
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
    const sdk = request.params.sdk;
    console.log("sdk:" + sdk);
    let candidates = request.body.candidates;
    //let table = req.body.table;
    const err = await DepthCandidateTable.IngestCandidates(
      candidates,
      DepthDBCredentials,
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
    let codegenRepo: RepoInfo = req.body.codegenRepo;
    if (codegenRepo === undefined) {
      const platform = req.body.platform;
      if (platform !== undefined && platform.toLowerCase() === "dev") {
        codegenRepo = default_codegen_repo;
      } else {
        codegenRepo = default_codegen_repo;
      }
    }
    const repo = req.body.repo;
    // const dbserver=process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
    // const db=process.env[ENVKEY.ENV_DEPTH_DATABASE];
    // const dbuser = process.env[ENVKEY.ENV_DEPTH_DB_USER];
    // const dbpw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
    const candidate = req.body.candidateResources;
    const err = await DepthCoverageHandler.TriggerOnboard(
      DepthDBCredentials,
      PipelineCredential.token,
      codegenRepo,
      candidate
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
}
