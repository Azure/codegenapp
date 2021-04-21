import { httpGet, controller, httpPost, BaseHttpController, httpPut } from "inversify-express-utils";
import { check } from "express-validator/check";
import { IngestCandidates } from "../CandidateService";
import { Request, Response, response } from "express";
import { JsonResult } from "inversify-express-utils/dts/results";
import { getCodeGeneration, UpdateCodeGenerationValue, ListCodeGenerations } from "../lib/CodeGeneration";
import { OnboardType, ORG, SDK } from "../lib/common";
import CodeGenerateHandler from "../lib/CodeGenerateHandler";
import DepthCoverageHandler from "../lib/DepthCoverageHandler";
import { CodegenDBCredentials, DepthDBCredentials } from "../lib/DBCredentials";
import { ENVKEY } from "../lib/Model";
import { CodeGeneration, CodeGenerationStatus, CodeGenerationDBColumn } from "../lib/CodeGenerationModel";
import { PipelineCredential } from "../lib/PipelineCredential";
// import { JsonResult } from "inversify-express-utils/dts/results/index"

@controller("/depthCoverage")
export class DepthCoverageController extends BaseHttpController{
    // public token: string = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    // public constructor(tk: string = undefined) {
    //     super();
    //     if (tk !== undefined) this.token = tk;
    // }
    @httpGet("/")
    public hello(): string{
        return "HelloWorld";
    }

    /*ingest depth-coverage candidates. */
    @httpPut("/sdk/:sdk/candidates", check("request").exists())
    public async Candidates(request: Request) :Promise<JsonResult> {
        // let res: Response = new Response();
        const dbserver=process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
        const db=process.env[ENVKEY.ENV_DEPTH_DATABASE];
        const dbuser = process.env[ENVKEY.ENV_DEPTH_DB_USER];
        const dbpw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
        const sdk = request.params.sdk;
        console.log("sdk:" + sdk);
        if (
            !dbserver ||
            !db ||
            !dbuser ||
            !dbpw 
        ) {
            //throw new Error("Missing required parameter");
            return this.json({error: "Missing required parameter"}, 400);
        }
        let candidates = request.body.candidates;
        //let table = req.body.table;
        const err = await IngestCandidates(candidates, dbserver, db, dbuser, dbpw, sdk);

        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = "ingest candidate";
        }
        return this.json(content, statusCode);
    }

    /*trigger depth-coverage. */
    @httpPost("/trigger")
    public async Trigger(req: Request) : Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const org = req.body.org;
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
            type = "dev";
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
        const err = await DepthCoverageHandler.TriggerOnboard(DepthDBCredentials.server, DepthDBCredentials.db, DepthDBCredentials.user, DepthDBCredentials.pw, PipelineCredential.token, org, repo, branch, candidate, type);
        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = "OK";
        }
        return this.json(content, statusCode);
    }

    /*complete an resource provider pipeline for a sdk. */
    @httpPost("/resourceProvider/:rpname/sdk/:sdk/complete", check("request").exists())
    public async Complete(request: Request): Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const org = ORG.AZURE;
        const rp = request.params.rpname;
        const sdk:string = request.params.sdk;
        let sdkorg:string = request.body.org;
        const swaggerorg: string = request.body.swaggerorg;
        if (sdkorg === undefined) {
            sdkorg = ORG.AZURE;
            if (sdk.toLowerCase() === SDK.TF_SDK) {
            sdkorg = ORG.MS;
            }
        }
        const onbaordtype: string = OnboardType.DEPTH_COVERAGE;
        let codegenorg: string = request.body.codegenorg;
        if (codegenorg === undefined) {
            codegenorg = ORG.AZURE;
        }
        const err = CodeGenerateHandler.CompleteCodeGeneration(PipelineCredential.token, rp, sdk, onbaordtype, codegenorg, sdkorg, swaggerorg);
        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = "Cancel " + onbaordtype + " for resource provider " + rp;
        }
        
        return this.json(content, statusCode);
        // /* delete depth-coverage rp branch */
        // let err = await DeletePipelineBranch(token, org, REPO.DEPTH_COVERAGE_REPO, branch);
        

        // /* delete sdk rp branch. */
        // let sdkrepo = "";
        // if (sdk === SDK.TF_SDK) {
        //     sdkrepo = REPO.TF_PROVIDER_REPO;
        // } else if (sdk === SDK.CLI_CORE_SDK) {
        //     sdkrepo = REPO.CLI_REPO;
        // }
        // try {
        //     await DeletePipelineBranch(token, sdkorg, sdkrepo, branch);
        //     let codebranch = "depth-code-" + sdk.toLowerCase() + "-" + rp;
        //     await DeletePipelineBranch(token, sdkorg, sdkrepo, codebranch);
        // } catch(e) {
        //     console.log("Failed to delete sdk branch: " + branch);
        //     console.log(e);
        // }

        // /*delete swagger rp branch */
        // try {
        //     await DeletePipelineBranch(token, swaggerorg != undefined ? swaggerorg: org, REPO.SWAGGER_REPO, branch);
        // } catch(e) {
        //     console.log("Failed to delete swagger branch: " + branch);
        //     console.log(e);
        // }

        // let content = {};
        // let statusCode = 200;
        // if (err !== undefined) {
        //     statusCode = 400;
        //     content = {error: err};
        // } else {
        //     statusCode = 200;
        //     content = rp + " " + sdk + ' onboarding is completed.';
        // }
        
        // return this.json(content, statusCode);
    }

    /* cancel all depth-coverages. */
    @httpPost("/cancel")
    public async CancelAllDepthCoverages(request: Request): Promise<JsonResult>{
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        // const org = request.body.org;
        // const repo = request.body.repo;
        // /* delete depth coverage branch. */
        // let err:any = undefined;
        // try {
        //     await DeleteAllDepthBranchs(token, org, repo);
        // } catch (e) {
        //     console.log("Failed to delete branches from depthcoverage.")
        //     console.log(e);
        //     err = e;
        // }

        // /* delete sdk branches. */
        // let content = {};
        // let statusCode = 200;
        // if (err !== undefined) {
        //     statusCode = 400;
        //     content = {error: err};
        // } else {
        //     statusCode = 200;
        //     content = "All Depth Coverage pipelines were cancelled";
        // }
        let canceledCodegens:string[] = [];
        let failedCodegens:string[] = [];
        let codegenorg: string = request.body.codegenorg;
        if (codegenorg === undefined) {
            codegenorg = ORG.AZURE;
        }

        let sdkorg:string = request.body.org;
        let swaggerorg: string = request.body.swaggerorg;
        
        if (swaggerorg === undefined) {
            swaggerorg = ORG.AZURE;
        }

        const type = OnboardType.DEPTH_COVERAGE;
        const codegens: CodeGeneration[] = await ListCodeGenerations(CodegenDBCredentials.server,
            CodegenDBCredentials.db,
            CodegenDBCredentials.user,
            CodegenDBCredentials.pw,
            type,
            true);
        
        for (let codegen of codegens) {
            if (sdkorg === undefined) {
                sdkorg = ORG.AZURE;
                if (codegen.sdk.toLowerCase() === SDK.TF_SDK) {
                    sdkorg = ORG.MS;
                }
            }
            const err = CodeGenerateHandler.CancelCodeGeneration(PipelineCredential.token, codegen.resourceProvider, codegen.sdk, type, codegenorg, sdkorg, swaggerorg);
            let content = "(" + codegen.resourceProvider + "," + codegen.sdk + ")";
            if (err !== undefined) {
                failedCodegens.push(content);
            } else {
                canceledCodegens.push(content);
            }
        }

        let ret = {
            cancelled: canceledCodegens.join(";"),
            failed: failedCodegens.join(";")
        }
        
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
        console.log("org:" + org + ",repo:" + repo + ",title:" + title + ",branch:" + branch + ",base:" + basebranch);
        // let prlink:string = undefined;
        // let err:any = undefined;
        // try {
        //     const pulls: string[] = await listOpenPullRequest(token, org, repo, branch, basebranch);
        //     if (pulls.length > 0) {
        //         prlink= pulls[0]
        //     } else {
        //         let {prlink:ret, err:e} = await SubmitPullRequest(token, org, repo, title, branch, basebranch);
        //         prlink = ret;
        //         err = e;
        //     }
        // }catch(e) {
        //     console.log(e);
        //     err = e;
        // }

        const {prlink, err} = await CodeGenerateHandler.GenerateCodeRullRequest(PipelineCredential.token, org, repo, title, branch, basebranch);
        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = prlink;
        }
        
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

        let err = await CodeGenerateHandler.SubmitGeneratedCode(rp, sdk, PipelineCredential.token, swaggerorg as string, org as string);

        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = rp + " onboarded";
        }
        
        return this.json(content, statusCode);
    }

    @httpPost("/resourceProvider/:rpname/sdk/:sdk/onboard")
    public async OnboardResourceProviderPOST(request: Request): Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const swaggerorg = request.body.swaggerorg;
        const org = request.body.org;
        const rp = request.params.rpname;
        const sdk = request.params.sdk;

        let err = await CodeGenerateHandler.SubmitGeneratedCode(rp, sdk, PipelineCredential.token, swaggerorg, org);

        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = rp + " onboarded";
        }
        
        return this.json(content, statusCode);
    }

    @httpGet("resourceProvider/:rpname/SDK/:sdk/customize")
    public async CustomizeResourceProviderGeneration(request: Request): Promise<JsonResult> {
        const org = request.query.org as string;
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const rp = request.params.rpname;
        const sdk = request.params.sdk;
        const triggerPR = request.query.triggerPR as string;
        const codePR = request.query.codePR as string;
        let excludeTest :boolean = false;
        if (request.query.excludeTest !== undefined) {
            excludeTest = Boolean(request.query.excludeTest);
        }

        const onbaordtype:string = OnboardType.DEPTH_COVERAGE;
        let {codegen, err} = await getCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                            rp,
                                                            sdk,
                                                            "depth");

        if (err === undefined || codegen === undefined) {
            console.log("No code generation pipeline for " + sdk + " of resource provider " + rp + ". No customize triggered.");
            return this.json({error: err}, 400);
        } else if (codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
                   codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS) {
            console.log("The code generation pipeline(" + rp + "," + sdk + ") is under " + codegen.status + ". No avaialbe to trigger customize now.");
            return this.json("No available to trigger customize now", 400);
        } else if (codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING) {
            console.log("The code generation pipeline(" + rp + "," + sdk + ") is under " + codegen.status + "Already. Ignore this trigger.");
            return this.json("customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId="+ codegen.pipelineBuildID, 201);
        }

        const custmizeerr = CodeGenerateHandler.CustomizeCodeGeneration(PipelineCredential.token, rp, sdk, onbaordtype, triggerPR, codePR, org, excludeTest);

        /* update the code generation status. */
        const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                    process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                    process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                    process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                    rp, 
                                                    sdk,
                                                    "depth",
                                                    CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
                                                    CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING);
        if (custmizeerr !== undefined) {
            return this.json({error: custmizeerr}, 400);
        } else {
            return this.json("customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId="+ codegen.pipelineBuildID, 201);
        }
    }

    @httpPost("resourceProvider/:rpname/SDK/:sdk/customize")
    public async CustomizeResourceProviderGenerationPOST(request: Request): Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const rp = request.params.rpname;
        const sdk = request.params.sdk;
        const org = request.body.org as string;
        const triggerPR = request.body.triggerPR as string;
        const codePR = request.body.codePR as string;
        let excludeTest :boolean = false;
        if (request.query.excludeTest !== undefined) {
            excludeTest = Boolean(request.body.excludeTest);
        }

        const onbaordtype:string = OnboardType.DEPTH_COVERAGE;

        let {codegen, err} = await getCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                            rp,
                                                            sdk,
                                                            "depth");

        if (err === undefined || codegen === undefined) {
            console.log("No code generation pipeline for " + sdk + " of resource provider " + rp + ". No customize triggered.");
            return this.json({error: err}, 400);
        } else if (codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
                   codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS) {
            console.log("The code generation pipeline(" + rp + "," + sdk + ") is under " + codegen.status + ". No avaialbe to trigger customize now.");
            return this.json("No available to trigger customize now", 400);
        } else if (codegen.status === CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING) {
            console.log("The code generation pipeline(" + rp + "," + sdk + ") is under " + codegen.status + "Already. Ignore this trigger.");
            return this.json("customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId="+ codegen.pipelineBuildID, 201);
        }
        const custmizeerr = CodeGenerateHandler.CustomizeCodeGeneration(PipelineCredential.token, rp, sdk, onbaordtype, triggerPR, codePR, org, excludeTest);

        if (custmizeerr === undefined) {
            /* update the code generation status. */
            const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                        process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                        process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                        process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                        rp, 
                                                        sdk,
                                                        "depth",
                                                        CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
                                                        CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING);
        }
        if (custmizeerr !== undefined) {
            return this.json({error: custmizeerr}, 400);
        } else {
            return this.json("customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId="+ codegen.pipelineBuildID, 201);
        }
    }

}

