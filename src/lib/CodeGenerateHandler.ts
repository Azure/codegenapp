import {
  DeleteBranch,
  ReadFileFromRepo,
  ReadCustomizeFiles,
  listOpenPullRequest,
  SubmitPullRequest,
} from "./CodeRepoGit";
import CodeGenerationTable, {
  CollectPipelineStages,
} from "./sqldb/CodeGenerationTable";
import {
  createBranch,
  uploadToRepo,
  createPullRequest,
  getBlobContent,
  NewOctoKit,
  getCurrentCommit,
  getBranch,
} from "../gitutil/GitAPI";
import { ResourceAndOperation, RESOUCEMAPFile, ENVKEY } from "./Model";
import {
  CodeGenerationDBColumn,
  CodeGenerationStatus,
  RepoInfo,
  SDKCodeGeneration,
} from "./CodeGenerationModel";
import { SDK, REPO, ORG, README } from "./common";
import { CodegenDBCredentials } from "./sqldb/DBCredentials";
import * as yaml from "node-yaml";
import { PipelineVariablesInterface } from "../config/pipelineVariables";
import { getGitRepoInfo } from "../config";

export class CodeGenerateHandler {
  ListSDKCodeGenerationsByStatus(
    token: string,
    resourceProvider: string,
    sdk: string,
    type: string,
    codegenorg: string,
    sdkorg: string,
    swaggerorg: string
  ) {
    throw new Error("Method not implemented.");
  }
  public constructor() {}

  /************** SDK Code Generation Operation ****************/
  public async CreateSDKCodeGeneration(
    name: string,
    token: string,
    codegenorg: string,
    codegenrepo: string,
    codegenBasebranch: string,
    rpToGen: ResourceAndOperation,
    owner?: string
  ): Promise<any> {
    // const RESOUCEMAPFile = "ToGenerate.json";
    const octo = NewOctoKit(token);
    let alreadyOnboard: boolean = await CodeGenerationTable.ExistValidSDKCodeGeneration(
      CodegenDBCredentials,
      name,
      rpToGen.onboardType
    );

    if (alreadyOnboard) {
      console.log(
        "Already triggerred to onboard " + rpToGen.RPName + ". Ignore this one."
      );
      return;
    }

    try {
      // const branchName =
      //   rpToGen.onboardType + "-" + rpToGen.target + "-" + rpToGen.RPName;
      const branchName = name;
      const baseCommit = await getCurrentCommit(
        octo,
        codegenorg,
        codegenrepo,
        codegenBasebranch
      );
      const targetBranch = await getBranch(
        octo,
        codegenorg,
        codegenrepo,
        branchName
      );
      // if (targetBranch !== undefined) {
      //     console.log("resource branch already exist.")
      //     return;
      // }
      await createBranch(
        octo,
        codegenorg,
        codegenrepo,
        branchName,
        baseCommit.commitSha
      );
      const fs = require("fs");
      fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rpToGen, null, 2));

      /* generate variable yml file */
      let st: string[] = CollectPipelineStages(
        rpToGen.onboardType,
        rpToGen.target
      );
      const v: PipelineVariablesInterface = {
        variables: {
          CodeGenerationName: name,
          SDK: rpToGen.target,
          stages: st.join(";"),
        },
      };
      fs.writeFileSync("Variables.yml", yaml.dump(v));

      await uploadToRepo(
        octo,
        ["ToGenerate.json", "Variables.yml"],
        codegenorg,
        codegenrepo,
        branchName
      );
      /* create pull request. */
      await createPullRequest(
        octo,
        codegenorg,
        codegenrepo,
        codegenBasebranch,
        branchName,
        "pull request from branch " + branchName
      );

      let content = await getBlobContent(
        octo,
        codegenorg,
        codegenrepo,
        branchName,
        RESOUCEMAPFile
      );
      console.log(content);

      let cg: SDKCodeGeneration = new SDKCodeGeneration(
        name,
        rpToGen.RPName,
        rpToGen.serviceType,
        rpToGen.resourcelist,
        rpToGen.tag,
        rpToGen.target,
        rpToGen.swaggerRepo,
        rpToGen.sdkRepo,
        rpToGen.codegenRepo,
        owner === undefined ? "" : owner,
        rpToGen.onboardType
      );
      let e = await CodeGenerationTable.SubmitSDKCodeGeneration(
        CodegenDBCredentials,
        cg
      );

      if (e !== undefined) {
        console.log(e);
      }
    } catch (ex) {
      console.log(ex);
      return ex;
    }

    return undefined;
  }

  /**
   *
   * @param token the github access token
   * @param rp the resource provider
   * @param sdk the target sdk, terraform, cli or others
   * @param onbaordtype the onboard type, depth, ad-hoc
   * @param codegenorg the org of codegen
   * @param sdkorg the org of sdk
   * @param swaggerorg the swagger org
   * @returns
   */
  public async CompleteSDKCodeGeneration(
    token: string,
    name: string
  ): Promise<any> {
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (
      getErr === undefined &&
      cg === undefined &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      return getErr;
    }

    const rp = cg.resourceProvider;
    const sdk = cg.sdk;
    const type = cg.type;

    const codegenrepo = cg.codegenRepo;
    const swagger_repo = cg.swaggerRepo;
    const sdk_repo = cg.sdkRepo;

    const branch = name;

    const err = await this.ClearSDKCodeGenerationWorkSpace(
      token,
      rp,
      sdk,
      type,
      codegenrepo,
      sdk_repo,
      swagger_repo,
      branch
    );
    /* update code generation status table. */
    const uperr = await CodeGenerationTable.UpdateSDKCodeGenerationValue(
      CodegenDBCredentials,
      name,
      CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
      CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED
    );

    if (uperr !== undefined) {
      console.log(uperr);
    }

    return err;
  }

  /**
   *
   * @param token The github access token
   * @param rp The resource provider
   * @param sdk The target sdk, terrform, cli or others
   * @param onbaordtype The onboard type, depth ad-hoc or others
   * @param codegenorg The codegen org
   * @param sdkorg The sdk org
   * @param swaggerorg The swagger org
   * @returns
   */
  public async CancelSDKCodeGeneration(
    token: string,
    name: string
  ): Promise<any> {
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (
      getErr === undefined &&
      cg === undefined &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      return getErr;
    }

    const rp = cg.resourceProvider;
    const sdk = cg.sdk;
    const type = cg.type;

    const codegenrepo: RepoInfo = cg.codegenRepo;
    const swagger_repo: RepoInfo = cg.swaggerRepo;
    const sdk_repo: RepoInfo = cg.sdkRepo;

    const branch = name;

    const err = await this.ClearSDKCodeGenerationWorkSpace(
      token,
      rp,
      sdk,
      type,
      codegenrepo,
      sdk_repo,
      swagger_repo,
      branch
    );
    /* update code generation status table. */
    const uperr = await CodeGenerationTable.UpdateSDKCodeGenerationValue(
      CodegenDBCredentials,
      name,
      CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
      CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    );

    if (uperr !== undefined) {
      console.log(uperr);
    }

    return err;
  }

  public async DeleteSDKCodeGeneration(
    token: string,
    name: string
  ): Promise<any> {
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (
      getErr === undefined &&
      cg === undefined &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      return getErr;
    }

    const rp = cg.resourceProvider;
    const sdk = cg.sdk;
    const type = cg.type;

    const codegenrepo = cg.codegenRepo;
    const swagger_repo = cg.swaggerRepo;
    const sdk_repo = cg.sdkRepo;

    const branch = name;

    /* clear work space. */
    const err = await this.ClearSDKCodeGenerationWorkSpace(
      token,
      rp,
      sdk,
      type,
      codegenrepo,
      sdk_repo,
      swagger_repo,
      branch
    );
    /* delete code generation from table. */
    const uperr = await CodeGenerationTable.DeleteSDKCodeGeneration(
      CodegenDBCredentials,
      name
    );

    if (uperr !== undefined) {
      console.log(uperr);
    }

    return err;
  }
  /**
   *
   * @param token The github access token
   * @param rp The resource provider
   * @param sdk The target sdk, terrform, cli or others
   * @param onbaordtype The onboard type, depth ad-hoc or others
   * @param codegenorg The codegen org
   * @param sdkorg The sdk org
   * @param swaggerorg The swagger org
   * @returns
   */
  public async ClearSDKCodeGenerationWorkSpace(
    token: string,
    rp: string,
    sdk: string,
    onbaordtype: string,
    codegenrepo: RepoInfo,
    sdkrepo: RepoInfo,
    swaggerrepo: RepoInfo,
    branch?: string
  ): Promise<any> {
    // const branch = onbaordtype + "-" + sdk.toLowerCase() + "-" + rp;
    if (branch === undefined) {
      branch = onbaordtype + "-" + sdk.toLowerCase() + "-" + rp;
    }
    /* delete depth-coverage rp branch */
    const { org: cgorg, repo: cgreop } = getGitRepoInfo(codegenrepo);
    let err = await DeleteBranch(token, cgorg, cgreop, branch);

    /* delete sdk rp branch. */
    // let sdkrepo = "";
    // if (sdk === SDK.TF_SDK) {
    //   sdkrepo = REPO.TF_PROVIDER_REPO;
    // } else if (sdk === SDK.CLI_CORE_SDK) {
    //   sdkrepo = REPO.CLI_REPO;
    // } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
    //   sdkrepo = REPO.CLI_EXTENSION_REPO;
    // }

    const { org: sdkorg, repo: sdkreponame } = getGitRepoInfo(sdkrepo);
    try {
      await DeleteBranch(token, sdkorg, sdkreponame, branch);
      let codebranch = branch + "-code";
      await DeleteBranch(token, sdkorg, sdkreponame, codebranch);
    } catch (e) {
      console.log("Failed to delete sdk branch: " + branch);
      console.log(e);
    }

    /*delete swagger rp branch */
    const { org: swaggerorg, repo: swagger_repo } = getGitRepoInfo(swaggerrepo);
    try {
      await DeleteBranch(token, swaggerorg, swagger_repo, branch);
    } catch (e) {
      console.log("Failed to delete swagger branch: " + branch);
      console.log(e);
    }

    return err;
  }

  /*Onboard, submit generated code to sdk repo, and readme to swagger repo. */
  /**
   *
   * @param rp The resource provider
   * @param sdk The target sdk, terraform, cli or others
   * @param token The github access token
   * @param swaggerorg The swagger org
   * @param sdkorg The sdk org
   * @param onboardtype The onboard type, depth, ad-hoc or others
   * @returns err if failure
   */
  public async SubmitGeneratedSDKCode(
    token: string,
    name: string
  ): Promise<any> {
    try {
      let {
        codegen: cg,
        err: getErr,
      } = await CodeGenerationTable.getSDKCodeGenerationByName(
        CodegenDBCredentials,
        name
      );

      if (
        getErr === undefined &&
        cg === undefined &&
        cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
        cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
      ) {
        return getErr;
      }

      const rp = cg.resourceProvider;
      const sdk = cg.sdk;
      const type = cg.type;

      const swaggerrepo = cg.swaggerRepo;
      const sdkrepo = cg.sdkRepo;

      const octo = NewOctoKit(token);
      /* generate PR in swagger repo. */
      let branch = name;
      // let branch = onboardtype + "-" + sdk + "-" + rp;

      const { org: swaggerorg, repo: swaggerreponame } = getGitRepoInfo(
        swaggerrepo
      );
      const swaggerPR = await createPullRequest(
        octo,
        swaggerorg !== undefined ? swaggerorg : ORG.AZURE,
        swaggerreponame !== undefined ? swaggerreponame : REPO.SWAGGER_REPO,
        swaggerrepo.branch,
        branch,
        "[" + type + ", " + rp + "]pull request from pipeline " + branch
      );

      /* generate PR in sdk code repo. */

      const { org: sdkorg, repo: sdkreponame } = getGitRepoInfo(sdkrepo);
      const codePR = await createPullRequest(
        octo,
        sdkorg,
        sdkreponame,
        sdkrepo.branch,
        branch,
        "[" + type + ", " + rp + "]pull request from pipeline " + branch
      );

      /* close work sdk branch. */
      // let workbranch = onboardtype + "-code-" + sdk + "-" + rp;
      let workbranch = name + "-code";
      await DeleteBranch(token, sdkorg, sdkreponame, workbranch);

      /* update the code generation status. */
      const values = {
        "swaggerPR": swaggerPR,
        "codePR": codePR,
        "status": CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED
      };
      const uperr = await CodeGenerationTable.UpdateSDKCodeGenerationValues(CodegenDBCredentials, name, values);

      if (uperr !== undefined) {
        console.log(uperr);
      }
    } catch (err) {
      console.log(err);
      return err;
    }

    return undefined;
  }

  /*Get basic information of an code generation. */
  public async GetSDKCodeGeneration(name: string): Promise<{codegen:SDKCodeGeneration, err: any}> {
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    return {
      codegen: cg,
      err: getErr
    }
  }

  /*Get detail information of an code generation. */
  public async GetSDKCodeGenerationDetailInfo(name: string): Promise<any> {
    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (getErr !== undefined || cg === undefined) {
      return getErr;
    }

    const pipelineId: string = cg.lastPipelineBuildID;
  }

  /*customize an code generation. */
  /**
   *
   * @param token The github access token
   * @param rp The resource provider
   * @param sdk The target sdk, terraform, cli or others
   * @param onboardType The onboard type, depth, ad-hoc or others
   * @param triggerPR The code generation pipeline trigger Pull Request
   * @param codePR The pull request for the generated code
   * @param sdkorg The sdk org
   * @param excludeTest indicate if ignore to run mock-test, live-test during this round of customize
   * @returns err if failure
   */
  public async CustomizeSDKCodeGeneration(
    token: string,
    name: string,
    triggerPR: string,
    codePR: string,
    excludeTest: boolean = false
  ): Promise<any> {
    const octo = NewOctoKit(token);
    let custmizeerr: any = undefined;

    let {
      codegen: cg,
      err: getErr,
    } = await CodeGenerationTable.getSDKCodeGenerationByName(
      CodegenDBCredentials,
      name
    );

    if (
      getErr === undefined &&
      cg === undefined &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
      cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
    ) {
      return getErr;
    }

    const rp = cg.resourceProvider;
    const sdk = cg.sdk;
    const type = cg.type;

    const codegenrepo = cg.codegenRepo;
    const swaggerrepo = cg.swaggerRepo;
    const sdkrepo = cg.sdkRepo;
    /* generate PR in swagger repo. */
    let branch = name;
    // let branch = onboardtype + "-" + sdk + "-" + rp;

    const { org: cgorg, repo: cgreponame } = getGitRepoInfo(codegenrepo);

    const jsonMapFile: string = "ToGenerate.json";
    const fs = require("fs");
    let filepaths: string[] = [];

    let content = await ReadFileFromRepo(
      token,
      cgorg !== undefined ? cgorg : ORG.AZURE,
      cgreponame !== undefined ? cgreponame : REPO.DEPTH_COVERAGE_REPO,
      branch,
      jsonMapFile
    );
    /* exclude test. */
    if (content !== undefined && content.length > 0) {
      //let content = fs.readFileSync(jsonMapFile);
      let resource: ResourceAndOperation = JSON.parse(content);
      let excludes: string[] = [];
      if (
        resource.excludeStages !== undefined &&
        resource.excludeStages.length > 0
      )
        excludes = resource.excludeStages.split(";");
      let ischanged: boolean = false;
      if (excludeTest) {
        if (excludes.indexOf("MockTest") === -1) {
          ischanged = true;
          excludes.push("MockTest");
        }
        if (excludes.indexOf("LiveTest") === -1) {
          ischanged = true;
          excludes.push("LiveTest");
        }
        resource.excludeStages = excludes.join(";");
      } else {
        let newArray = excludes.filter(
          (item) => item !== "MockTest" && item !== "LiveTest"
        );
        if (newArray.length !== excludes.length) {
          resource.excludeStages = newArray.join(";");
          ischanged = true;
        }
      }

      if (ischanged) {
        fs.writeFileSync(jsonMapFile, JSON.stringify(resource, null, 2));
        filepaths.push(jsonMapFile);
      }
    }

    let readfile = README.CLI_README_FILE;
    if (sdk === SDK.TF_SDK) {
      readfile = README.TF_README_FILE;
    }

    let tfSchemafile = "azurerm/internal/services/" + rp + "/schema.json";
    let tfSchemaDir = "azurerm/internal/services/" + rp;
    const { org: sdkorg, repo: sdkreponame } = getGitRepoInfo(sdkrepo);
    const prNumber = codePR.split("/").pop();
    const filelist: string[] = [readfile];
    if (sdk === SDK.TF_SDK) {
      filelist.push(tfSchemafile);
      if (!fs.existsSync(tfSchemaDir)) {
        fs.mkdirSync(tfSchemaDir, { recursive: true });
      }
    }
    const readedFiles: string = await ReadCustomizeFiles(token, sdkorg, sdkreponame, +prNumber, filelist);

    /* copy configuration to swagger repo */

    console.log(__dirname);
    const specpath = "specification/" + rp + "/resource-manager";
    if (!fs.existsSync(specpath)) {
      fs.mkdirSync(specpath, { recursive: true });
    }
    const swaggerReadMePath =
      "specification/" + rp + "/resource-manager/" + readfile;
    fs.copyFile(readfile, swaggerReadMePath, (err) => {
      if (err) {
        console.log("Error Found:", err);
      } else {
        // Get the current filenames
        // after the function
        fs.readdirSync(__dirname).forEach((file) => {
          console.log(file);
        });
        console.log("\nFile Contents of copied_file:");
      }
    });

    filepaths.push(swaggerReadMePath);

    if (sdk === SDK.TF_SDK && readedFiles.indexOf(tfSchemafile) !== -1) {
      const schemapath = "schema.json";
      const swaggerSchemaPath =
        "specification/" + rp + "/resource-manager/" + schemapath;
      fs.copyFile(tfSchemafile, swaggerSchemaPath, (err) => {
        if (err) {
          console.log("Error Found:", err);
        } else {
          // Get the current filenames
          // after the function
          fs.readdirSync(__dirname).forEach((file) => {
            console.log(file);
          });
          console.log("\nFile Contents of copied_file:");
        }
      });
      filepaths.push(swaggerSchemaPath);
    }

    try {
      /* update depth-coverage-pipeline trigger pull request. */
      await uploadToRepo(
        octo,
        filepaths,
        cgorg !== undefined ? cgorg : ORG.AZURE,
        cgreponame !== undefined ? cgreponame : REPO.DEPTH_COVERAGE_REPO,
        branch
      );
    } catch (e) {
      console.log(e);
      return e;
    }

    if (custmizeerr === undefined) {
      /* update the code generation status. */
      const uperr = await CodeGenerationTable.UpdateSDKCodeGenerationValue(
        CodegenDBCredentials,
        name,
        CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
        CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING
      );
    }
    /* delete sdk rp branch. */

    return undefined;
  }

  /**
   * Generate pull request for the generated code
   * @param token The github access token
   * @param org The org of the repo to submit code to
   * @param repo The repository to submit code to
   * @param title The pull request title
   * @param branch The head branch of the pull request
   * @param basebranch The base branch of the pull request
   * @returns
   */
  public async GenerateCodeRullRequest(
    token: string,
    org: string,
    repo: string,
    title: string,
    branch: string,
    basebranch: string
  ): Promise<{ prlink: string; err: any }> {
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
    let prlink: string = undefined;
    let err: any = undefined;
    try {
      const pulls: string[] = await listOpenPullRequest(
        token,
        org,
        repo,
        branch,
        basebranch
      );
      if (pulls.length > 0) {
        prlink = pulls[0];
      } else {
        let { prlink: ret, err: e } = await SubmitPullRequest(
          token,
          org,
          repo,
          title,
          branch,
          basebranch
        );
        prlink = ret;
        err = e;
      }
    } catch (e) {
      console.log(e);
      err = e;
    }

    return { prlink, err };
  }
}

export default new CodeGenerateHandler();
