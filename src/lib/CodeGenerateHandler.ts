import {
  DeleteBranch,
  ReadFileFromRepo,
  ReadCustomizeFiles,
  listOpenPullRequest,
  SubmitPullRequest,
} from "./CodeRepoGit";
import {
  IsValidCodeGenerationExist,
  InsertCodeGeneration,
  UpdateCodeGenerationValue,
} from "./CodeGeneration";
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
  CodeGeneration,
  CodeGenerationDBColumn,
  CodeGenerationStatus,
} from "./CodeGenerationModel";
import { SDK, REPO, ORG, README } from "./common";
import { CodegenDBCredentials } from "./DBCredentials";
import { PipelineVariables } from "./PipelineVariableModel";
import * as yaml from "node-yaml";
import { PipelineVariablesInterface } from "../config/pipelineVariables";

export class CodeGenerateHandler {
  public constructor() {}
  /**
   *
   * @param token the pipeline access token
   * @param codegenorg the codegen pipeline org
   * @param codegenrepo the codegen pipeline repo
   * @param basebranch the basebranch
   * @param rpToGen the resources to generation.
   */
  public async TriggerCodeGeneration(
    token: string,
    codegenorg: string,
    codegenrepo: string,
    basebranch: string,
    rpToGen: ResourceAndOperation
  ): Promise<any> {
    // const RESOUCEMAPFile = "ToGenerate.json";
    const octo = NewOctoKit(token);
    let alreadyOnboard: boolean = await IsValidCodeGenerationExist(
      CodegenDBCredentials.server,
      CodegenDBCredentials.db,
      CodegenDBCredentials.user,
      CodegenDBCredentials.pw,
      rpToGen.RPName,
      rpToGen.target,
      rpToGen.onboardType
    );

    if (alreadyOnboard) {
      console.log(
        "Already triggerred to onboard " + rpToGen.RPName + ". Ignore this one."
      );
      return;
    }

    try {
      const branchName =
        rpToGen.onboardType + "-" + rpToGen.target + "-" + rpToGen.RPName;
      const baseCommit = await getCurrentCommit(
        octo,
        codegenorg,
        codegenrepo,
        basebranch
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
      const v: PipelineVariablesInterface = {
        variables: {
          SDK: rpToGen.target,
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
        basebranch,
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

      /* insert code generation status table. */
      let cg: CodeGeneration = new CodeGeneration(
        rpToGen.RPName,
        rpToGen.target,
        rpToGen.onboardType,
        rpToGen.resourcelist
      );
      let e = await InsertCodeGeneration(
        CodegenDBCredentials.server,
        CodegenDBCredentials.db,
        CodegenDBCredentials.user,
        CodegenDBCredentials.pw,
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
  public async CompleteCodeGeneration(
    token: string,
    rp: string,
    sdk: string,
    onbaordtype: string,
    codegenorg: string,
    sdkorg: string,
    swaggerorg: string
  ): Promise<any> {
    const err = await this.ClearCodeGenerationWorkSpace(
      token,
      rp,
      sdk,
      onbaordtype,
      codegenorg,
      sdkorg,
      swaggerorg
    );
    /* update code generation status table. */
    const uperr = await UpdateCodeGenerationValue(
      CodegenDBCredentials.server,
      CodegenDBCredentials.db,
      CodegenDBCredentials.user,
      CodegenDBCredentials.pw,
      rp,
      sdk,
      onbaordtype,
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
  public async CancelCodeGeneration(
    token: string,
    rp: string,
    sdk: string,
    onbaordtype: string,
    codegenorg: string,
    sdkorg: string,
    swaggerorg: string
  ): Promise<any> {
    const err = await this.ClearCodeGenerationWorkSpace(
      token,
      rp,
      sdk,
      onbaordtype,
      codegenorg,
      sdkorg,
      swaggerorg
    );
    /* update code generation status table. */
    const uperr = await UpdateCodeGenerationValue(
      CodegenDBCredentials.server,
      CodegenDBCredentials.db,
      CodegenDBCredentials.user,
      CodegenDBCredentials.pw,
      rp,
      sdk,
      onbaordtype,
      CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
      CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
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
  public async ClearCodeGenerationWorkSpace(
    token: string,
    rp: string,
    sdk: string,
    onbaordtype: string,
    codegenorg: string,
    sdkorg: string,
    swaggerorg: string
  ): Promise<any> {
    const branch = onbaordtype + "-" + sdk.toLowerCase() + "-" + rp;
    /* delete depth-coverage rp branch */
    let err = await DeleteBranch(
      token,
      codegenorg,
      REPO.DEPTH_COVERAGE_REPO,
      branch
    );

    /* delete sdk rp branch. */
    let sdkrepo = "";
    if (sdk === SDK.TF_SDK) {
      sdkrepo = REPO.TF_PROVIDER_REPO;
    } else if (sdk === SDK.CLI_CORE_SDK) {
      sdkrepo = REPO.CLI_REPO;
    } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
      sdkrepo = REPO.CLI_EXTENSION_REPO;
    }

    try {
      await DeleteBranch(token, sdkorg, sdkrepo, branch);
      let codebranch = onbaordtype + "-code-" + sdk.toLowerCase() + "-" + rp;
      await DeleteBranch(token, sdkorg, sdkrepo, codebranch);
    } catch (e) {
      console.log("Failed to delete sdk branch: " + branch);
      console.log(e);
    }

    /*delete swagger rp branch */
    try {
      await DeleteBranch(token, swaggerorg, REPO.SWAGGER_REPO, branch);
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
  public async SubmitGeneratedCode(
    rp: string,
    sdk: string,
    token: string,
    swaggerorg: string = undefined,
    sdkorg: string = undefined,
    onboardtype: string = "depth"
  ): Promise<any> {
    try {
      const octo = NewOctoKit(token);
      /* generate PR in swagger repo. */
      let basebranch = "master";
      sdk = sdk.toLowerCase();
      let branch = onboardtype + "-" + sdk + "-" + rp;

      await createPullRequest(
        octo,
        swaggerorg !== undefined ? swaggerorg : ORG.AZURE,
        REPO.SWAGGER_REPO,
        basebranch,
        branch,
        "[Depth Coverage, " + rp + "]pull request from pipeline " + branch
      );

      /* generate PR in sdk code repo. */
      let sdkrepo = "";
      let sdkbasebranch = "master";
      // let sdkorg = sdkorg;
      if (sdkorg === undefined) {
        if (sdk === SDK.TF_SDK) {
          sdkrepo = REPO.TF_PROVIDER_REPO;
          sdkorg = ORG.MS;
        } else if (sdk === SDK.CLI_CORE_SDK) {
          sdkrepo = REPO.CLI_REPO;
          sdkbasebranch = "dev";
        } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
          sdkrepo = REPO.CLI_REPO;
          sdkbasebranch = "master";
        }
      }

      await createPullRequest(
        octo,
        sdkorg,
        sdkrepo,
        sdkbasebranch,
        branch,
        "[Depth Coverage, " + rp + "]pull request from pipeline " + branch
      );

      /* close work sdk branch. */
      let workbranch = onboardtype + "-code-" + sdk + "-" + rp;
      await DeleteBranch(token, sdkorg, sdkrepo, workbranch);

      /* update the code generation status. */
      /* update code generation status table. */
      const uperr = await UpdateCodeGenerationValue(
        CodegenDBCredentials.server,
        CodegenDBCredentials.db,
        CodegenDBCredentials.user,
        CodegenDBCredentials.pw,
        rp,
        sdk,
        onboardtype,
        CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
        CodeGenerationStatus.CODE_GENERATION_STATUS_PIPELINE_COMPLETED
      );

      if (uperr !== undefined) {
        console.log(uperr);
      }
    } catch (err) {
      console.log(err);
      return err;
    }

    return undefined;
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
  public async CustomizeCodeGeneration(
    token: string,
    rp: string,
    sdk: string,
    onboardType: string,
    triggerPR: string,
    codePR: string,
    sdkorg: string = undefined,
    excludeTest: boolean = false
  ): Promise<any> {
    const octo = NewOctoKit(token);
    let custmizeerr: any = undefined;
    // const org = ORG.AZURE;
    // let sdkorg = ORG.AZURE;
    if (sdkorg === undefined) {
      sdkorg = ORG.AZURE;
    }
    sdk = sdk.toLowerCase();
    if (sdk === SDK.TF_SDK) {
      sdkorg = ORG.MS;
      sdk = sdk.toLowerCase();
    }

    const branch = onboardType + "-" + sdk + "-" + rp;

    let sdkrepo = "";
    let readfile = README.CLI_README_FILE;
    if (sdk === SDK.TF_SDK) {
      sdkrepo = REPO.TF_PROVIDER_REPO;
      readfile = README.TF_README_FILE;
    } else if (sdk === SDK.CLI_CORE_SDK) {
      sdkrepo = REPO.CLI_REPO;
    }

    const jsonMapFile: string = "ToGenerate.json";
    const fs = require("fs");
    let filepaths: string[] = [];

    let content = await ReadFileFromRepo(
      token,
      ORG.AZURE,
      REPO.DEPTH_COVERAGE_REPO,
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

    const prNumber = codePR.split("/").pop();
    const filelist: string[] = [readfile, "schema.json"];
    await ReadCustomizeFiles(token, sdkorg, sdkrepo, +prNumber, filelist);

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

    if (sdk === SDK.TF_SDK) {
      const schemapath = "schema.json";
      const swaggerSchemaPath =
        "specification/" + rp + "/resource-manager/" + schemapath;
      fs.copyFile(schemapath, swaggerSchemaPath, (err) => {
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
        ORG.AZURE,
        REPO.DEPTH_COVERAGE_REPO,
        branch
      );
    } catch (e) {
      console.log(e);
      return e;
    }

    if (custmizeerr === undefined) {
      /* update the code generation status. */
      const uperr = await UpdateCodeGenerationValue(
        CodegenDBCredentials.server,
        CodegenDBCredentials.db,
        CodegenDBCredentials.user,
        CodegenDBCredentials.pw,
        rp,
        sdk,
        onboardType,
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
