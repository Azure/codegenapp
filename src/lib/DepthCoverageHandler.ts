import {
  NewOctoKit,
  listBranchs,
  getCurrentCommit,
  getBranch,
  createBranch,
  uploadToRepo,
  createPullRequest,
  getBlobContent,
} from "../gitutil/GitAPI";
import { DeleteBranch } from "./CodeRepoGit";
import {
  DepthCoverageType,
  SQLQueryStr,
  Operation,
  Resource,
} from "./DepthCoverageModel";
import {
  ResourceAndOperation,
  OnboardOperation,
  OnboardResource,
  ENVKEY,
  RESOUCEMAPFile,
} from "./Model";
import { CandidateResource } from "./ResourceCandiateModel";
import { AutorestSDK } from "./common";
import {
  IsValidCodeGenerationExist,
  InsertCodeGeneration,
} from "./CodeGeneration";
import { CodegenDBCredentials } from "./DBCredentials";
import { CodeGeneration } from "./CodeGenerationModel";
import CodeGenerateHandler from "./CodeGenerateHandler";
import { PipelineCredential } from "./PipelineCredential";

export class DepthCoverageHandler {
  public async RetriveResourceToGenerate(
    server: string,
    db: string,
    user: string,
    pw: string,
    depthcoverageType: string,
    supportedResources: CandidateResource[] = undefined
  ): Promise<ResourceAndOperation[]> {
    const opOrresources: any[] = await this.QueryDepthCoverageReport(
      server,
      db,
      user,
      pw,
      depthcoverageType
    );
    //const supportedResource:Set<string> = new Set(["Microsoft.Security/devices", "Microsoft.Consumption/marketplaces", "Microsoft.CertificateRegistration/certificateOrders"]);
    // const supportedService:Set<string> = new Set(["compute", "authorization", "storage", "sql", "web", "keyvault","network", "resources"]);
    // const supportedService:Set<string> = new Set(["compute", "network"]);
    /*TODO: get the supported service from db. */

    let sdk = "";
    if (
      depthcoverageType ===
        DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
      depthcoverageType ===
        DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE
    ) {
      sdk = AutorestSDK.AUTOREST_SDK_CLI_CORE;
    } else {
      sdk = AutorestSDK.AUTOREST_SDK_TF;
    }
    if (
      depthcoverageType ===
        DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
      depthcoverageType ===
        DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION
    ) {
      const res: ResourceAndOperation[] = await this.ConvertOperationToDepthCoverageResourceAndOperation(
        opOrresources,
        sdk,
        supportedResources
      );
      console.log(res);

      return res;
    } else {
      const res: ResourceAndOperation[] = await this.ConvertResourceToDepthCoverageResourceAndOperation(
        opOrresources,
        sdk,
        supportedResources
      );
      console.log(res);

      return res;
    }
  }

  public async DeleteAllDepthBranchs(token: string, org: string, repo: string) {
    const octo = NewOctoKit(token);
    let branches: string[] = await listBranchs(octo, org, repo);
    for (let branch of branches) {
      if (branch.startsWith("depth")) {
        await DeleteBranch(token, org, repo, branch);
      }
    }
  }

  public async QueryCandidateResources(
    server: string,
    database: string,
    user: string,
    password: string,
    depthcoverageType: string
  ): Promise<CandidateResource[]> {
    let candidates: CandidateResource[] = [];
    var sql = require("mssql");
    var config = {
      user: user,
      password: password,
      server: server,
      database: database,
    };

    let conn = undefined;
    try {
      let conn = await sql.connect(config);

      let queryStr = "";
      switch (depthcoverageType) {
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE:
          queryStr = SQLQueryStr.SQLQUERY_TF_CANDIDATE_RESOURCE;
          break;
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION:
          queryStr = SQLQueryStr.SQLQUERY_TF_CANDIDATE_RESOURCE;
          break;
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE:
          queryStr = SQLQueryStr.SQLQUERY_CLI_CANDIDATE_OPERATION;
          break;
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION:
          queryStr = SQLQueryStr.SQLQUERY_CLI_CANDIDATE_OPERATION;
          break;
        default:
      }

      let result = await conn.request().query(queryStr);
      for (let record of result.recordset) {
        let rs: CandidateResource = new CandidateResource(
          record["resourceProvider"],
          record["fullResourceType"],
          record["fileName"],
          record["apiVersion"],
          record["tag"]
        );
        candidates.push(rs);
      }
    } catch (e) {
      console.log(e);
    }

    return candidates;
  }

  public async QueryDepthCoverageReport(
    server: string,
    database: string,
    user: string,
    password: string,
    depthcoverageType: string
  ): Promise<any[]> {
    let missing: any[] = [];
    var sql = require("mssql");
    var config = {
      user: user,
      password: password,
      server: server,
      database: database,
    };

    let conn = undefined;
    try {
      let conn = await sql.connect(config);

      let queryStr = "";
      let sdk = "";
      switch (depthcoverageType) {
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE:
          queryStr = SQLQueryStr.SQLQUERY_TF_NOT_SUPPORT_RESOURCE;
          sdk = AutorestSDK.AUTOREST_SDK_TF;
          break;
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION:
          queryStr = SQLQueryStr.SQLQUERY_TF_NOT_SUPPORT_OPERATION;
          sdk = AutorestSDK.AUTOREST_SDK_TF;
          break;
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE:
          queryStr = SQLQueryStr.SQLQUERY_CLI_NOT_SUPPOT_RESOURCE;
          sdk = AutorestSDK.AUTOREST_SDK_CLI_CORE;
          break;
        case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION:
          queryStr = SQLQueryStr.SQLQUERY_CLI_NOT_SUPPORT_OPERATION;
          sdk = AutorestSDK.AUTOREST_SDK_CLI_CORE;
          break;
        default:
      }

      let result = await conn.request().query(queryStr);

      if (
        depthcoverageType ===
          DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
        depthcoverageType ===
          DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION
      ) {
        for (let record of result.recordset) {
          let op: Operation = new Operation(
            record["path"],
            record["fullResourceType"],
            record["operationName"],
            record["operationId"],
            record["fileName"]
          );
          missing.push(op);
        }
      } else {
        for (let record of result.recordset) {
          let rs: Resource = new Resource(
            record["fullResourceType"],
            record["fileName"]
          );
          missing.push(rs);
        }
      }
    } catch (e) {
      console.log(e);
      if (conn !== undefined) conn.close();
      sql.close();
    }

    console.log("missing:" + missing.length);
    return missing;
  }

  public IsCandidateResource(
    candidates: CandidateResource[],
    resourceProvider: string,
    fullResourceType: string
  ): boolean {
    for (let candidate of candidates) {
      if (
        candidate.resourceProvider === resourceProvider &&
        (candidate.fullResourceType.toLowerCase() === "all" ||
          candidate.fullResourceType === fullResourceType)
      )
        return true;
    }

    return false;
  }

  public GetCandidateResource(
    candidates: CandidateResource[],
    resourceProvider: string,
    fullResourceType: string
  ): CandidateResource {
    if (candidates === undefined) return undefined;
    for (let candidate of candidates) {
      if (
        candidate.resourceProvider === resourceProvider &&
        (candidate.fullResourceType.toLowerCase() === "all" ||
          candidate.fullResourceType === fullResourceType)
      )
        return candidate;
    }

    return undefined;
  }

  public async ConvertOperationToDepthCoverageResourceAndOperation(
    ops: Operation[],
    sdk: string,
    supportedResource: CandidateResource[] = undefined
  ): Promise<ResourceAndOperation[]> {
    let result: ResourceAndOperation[] = [];
    const specFileRegex =
      "(specification/)+(.*)/(resourcemanager|resource-manager|dataplane|data-plane|control-plane)/(.*)/(preview|stable|privatepreview)/(.*?)/(example)?(.*)";
    for (let op of ops) {
      let m = op.fileName.match(specFileRegex);
      if (!m) {
        console.warn(`\tFail to parse swagger file json ${op.fileName}`);
        continue;
      }
      let [
        path,
        ,
        serviceName,
        serviceType,
        resourceProvider,
        releaseState,
        apiVersion,
        ,
        fileName,
      ] = m;
      // console.log("path:" + path);
      // console.log("serviceName:" + serviceName);
      // console.log("serviceType:" + serviceType);
      // console.log("resourceProvider:" + resourceProvider);
      // console.log("releaseState:" + releaseState);
      // console.log("apiVersion:" + apiVersion);
      // console.log("fileName:" + fileName);
      if (
        supportedResource !== undefined &&
        !this.IsCandidateResource(
          supportedResource,
          serviceName,
          op.fullResourceType
        )
      )
        continue;
      /* use api-version in candidate. */
      let candidate = this.GetCandidateResource(
        supportedResource,
        serviceName,
        op.fullResourceType
      );
      if (
        candidate !== undefined &&
        candidate.apiVersion.toLowerCase() != "all"
      ) {
        apiVersion = candidate.apiVersion;
      }

      /*use tag in candidate. */
      let tag: string = undefined;
      if (
        candidate != undefined &&
        candidate.tag !== undefined &&
        candidate.tag !== null &&
        candidate.tag.toLowerCase() != "all"
      ) {
        tag = candidate.tag;
      }
      let rp = this.GetResourceProvide(result, serviceName);
      if (rp === undefined) {
        let readme =
          op.fileName.split("/").slice(0, 4).join("/") + "/readme.md";
        rp = new ResourceAndOperation(serviceName, readme, [], sdk);
        result.push(rp);
      }
      if (tag !== undefined) {
        if (rp.tag === undefined) {
          rp.tag = tag;
        } else if (rp.tag.indexOf(tag) === -1) {
          rp.tag = rp.tag + ";" + tag;
        }
      }
      let rs = this.GetResource(rp.resources, op.fullResourceType);
      if (rs !== undefined) {
        let find = this.GetOperation(rs.operations, op.operationId);
        if (find === undefined) {
          rs.operations.push(
            new OnboardOperation(op.operationId, apiVersion, op.fileName)
          );
        }
      } else {
        rs = new OnboardResource(op.fullResourceType, apiVersion);
        rs.operations.push(
          new OnboardOperation(op.operationId, apiVersion, op.fileName)
        );
        rp.resources.push(rs);
      }
      if (tag !== undefined) rs.tag = tag;
      if (!this.Contains(rp.jsonFilelist, op.fileName))
        rp.jsonFilelist.push(op.fileName);
    }

    return result;
  }

  public async ConvertResourceToDepthCoverageResourceAndOperation(
    resourcelist: Resource[],
    sdk: string,
    supportedResource: CandidateResource[] = undefined
  ): Promise<ResourceAndOperation[]> {
    let result: ResourceAndOperation[] = [];
    const specFileRegex =
      "(specification/)+(.*)/(resourcemanager|resource-manager|dataplane|data-plane|control-plane)/(.*)/(preview|stable|privatepreview)/(.*?)/(example)?(.*)";
    for (let crs of resourcelist) {
      let m = crs.fileName.match(specFileRegex);
      if (!m) {
        console.warn(`\tFail to parse swagger file json ${crs.fileName}`);
        continue;
      }
      const [
        path,
        ,
        serviceName,
        serviceType,
        resourceProvider,
        releaseState,
        apiVersion,
        ,
        fileName,
      ] = m;
      // console.log("path:" + path);
      // console.log("serviceName:" + serviceName);
      // console.log("serviceType:" + serviceType);
      // console.log("resourceProvider:" + resourceProvider);
      // console.log("releaseState:" + releaseState);
      // console.log("apiVersion:" + apiVersion);
      // console.log("fileName:" + fileName);
      if (
        supportedResource !== undefined &&
        !this.IsCandidateResource(
          supportedResource,
          serviceName,
          crs.fullResourceType
        )
      )
        continue;
      let candidate = this.GetCandidateResource(
        supportedResource,
        serviceName,
        crs.fullResourceType
      );
      /*use tag in candidate. */
      let tag: string = undefined;
      if (
        candidate !== undefined &&
        candidate.tag !== undefined &&
        candidate.tag !== null &&
        candidate.tag.toLowerCase() != "all"
      ) {
        tag = candidate.tag;
      }
      let rp = this.GetResourceProvide(result, serviceName);
      if (rp === undefined) {
        let readme =
          crs.fileName.split("/").slice(0, 4).join("/") + "/readme.md";
        rp = new ResourceAndOperation(serviceName, readme, [], sdk);
        result.push(rp);
      }
      if (tag !== undefined) {
        if (rp.tag === undefined) {
          rp.tag = tag;
        } else if (rp.tag.indexOf(tag) === -1) {
          rp.tag = rp.tag + ";" + tag;
        }
      }
      let rs = this.GetResource(rp.resources, crs.fullResourceType);
      if (rs === undefined) {
        rs = new OnboardResource(crs.fullResourceType, apiVersion);
        rp.resources.push(rs);
        if (!this.Contains(rp.jsonFilelist, crs.fileName))
          rp.jsonFilelist.push(crs.fileName);
      }
      if (tag !== undefined) rs.tag = tag;
    }

    return result;
  }

  public async TriggerOnboard(
    dbserver: string,
    db: string,
    dbuser: string,
    dbpw: string,
    token: string,
    org: string,
    repo: string,
    basebranch: string = "main",
    supported: string[] = undefined,
    type: string = "depth"
  ): Promise<any> {
    let tfsupportedResource: CandidateResource[] = undefined;
    const tfcandidates = await this.QueryCandidateResources(
      dbserver,
      db,
      dbuser,
      dbpw,
      DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE
    );
    if (
      tfcandidates.length > 0 ||
      (supported !== undefined && supported.length > 0)
    ) {
      tfsupportedResource = [];
      for (let candidate of tfcandidates) {
        tfsupportedResource.push(candidate);
      }

      if (supported !== undefined) {
        for (let s of supported) {
          const candidate = new CandidateResource(s, "ALL");
          tfsupportedResource.push(candidate);
        }
      }
    }
    const tfresources = await this.RetriveResourceToGenerate(
      dbserver,
      db,
      dbuser,
      dbpw,
      DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE,
      tfsupportedResource
    );

    let clisupportedResource: CandidateResource[] = undefined;
    const clicandidates = await this.QueryCandidateResources(
      dbserver,
      db,
      dbuser,
      dbpw,
      DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION
    );
    if (
      clicandidates.length > 0 ||
      (supported !== undefined && supported.length > 0)
    ) {
      clisupportedResource = [];
      for (let candidate of clicandidates) {
        clisupportedResource.push(candidate);
      }

      if (supported !== undefined) {
        for (let s of supported) {
          const candidate = new CandidateResource(s, "ALL");
          clisupportedResource.push(candidate);
        }
      }
    }

    const cliresources = await this.RetriveResourceToGenerate(
      dbserver,
      db,
      dbuser,
      dbpw,
      DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION,
      clisupportedResource
    );

    let resources = tfresources.concat(cliresources);
    // let resources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION);

    // const RESOUCEMAPFile = "ToGenerate.json";
    const octo = NewOctoKit(token);

    const fs = require("fs");
    for (let rs of resources) {
      try {
        rs.generateResourceList();
        // let alreadyOnboard: boolean = await IsValidCodeGenerationExist(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
        //                                                     process.env[ENVKEY.ENV_CODEGEN_DATABASE],
        //                                                     process.env[ENVKEY.ENV_CODEGEN_DB_USER],
        //                                                     process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
        //                                                     rs.RPName,
        //                                                     rs.target,
        //                                                     type);
        // if (alreadyOnboard) {
        //     console.log("Already triggerred to onboard " + rs.RPName + ". Ignore this one.");
        //     continue;
        // }

        // const branchName = type + "-" + rs.target + "-" + rs.RPName;
        // const baseCommit = await getCurrentCommit(octo, org, repo, basebranch);
        // const targetBranch = await getBranch(octo, org, repo, branchName);
        // if (targetBranch !== undefined) {
        //     console.log("resource branch already exist.")
        //     continue;
        // }
        // await createBranch(octo, org, repo, branchName, baseCommit.commitSha);
        // fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rs, null, 2));
        // await uploadToRepo(octo, ["ToGenerate.json"], org, repo, branchName);
        // /* create pull request. */
        // await createPullRequest(octo, org, repo, basebranch, branchName, "pull request from branch " + branchName);

        // // let pullData = await getPullRequest(octo, org, repo, 6);
        // // console.log(pullData);

        // // let commitData = await getCommit(octo, org, repo, "6ae620b1fa2c528e7737c81020fed22dd94356b3");
        // // console.log(commitData);

        // // let content = await getBlobContent(octo, org, repo, branchName, RESOUCEMAPFile);
        // // console.log(content);

        // // await deleteBranch(octo, org, repo, branchName);

        // /* update code generation status table. */
        // let cg: CodeGeneration = new CodeGeneration(rs.RPName, rs.target, rs.onboardType);
        // // let e = await InsertCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER], process.env[ENVKEY.ENV_CODEGEN_DATABASE], process.env[ENVKEY.ENV_CODEGEN_DB_USER], process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD], cg);
        // console.log("trigger(" + CodegenDBCredentials.server + "," + CodegenDBCredentials.db + "," + CodegenDBCredentials.user + "," + CodegenDBCredentials.pw + ")");
        // let e = await InsertCodeGeneration(CodegenDBCredentials.server, CodegenDBCredentials.db, CodegenDBCredentials.user, CodegenDBCredentials.pw, cg);
        // if (e !== undefined) {
        //     console.log(e);
        // }
        const err = await CodeGenerateHandler.TriggerCodeGeneration(
          PipelineCredential.token,
          org,
          repo,
          basebranch,
          rs
        );
      } catch (err) {
        console.log(err);
        return err;
      }
    }

    return undefined;
  }

  public Contains(list: string[], target: string): boolean {
    for (let str of list) {
      if (str === target) return true;
    }

    return false;
  }
  public GetResourceProvide(resources: ResourceAndOperation[], rp: string) {
    for (let r of resources) {
      if (r.RPName === rp) return r;
    }

    return undefined;
  }
  public GetResource(
    resources: OnboardResource[],
    resource: string
  ): OnboardResource {
    for (let r of resources) {
      if (r.Resource === resource) return r;
    }
    return undefined;
  }

  public GetOperation(operations: OnboardOperation[], id: string) {
    for (let op of operations) {
      if (op.OperationId === id) return op;
    }

    return undefined;
  }
}

export default new DepthCoverageHandler();
