import { BaseHttpController, controller, httpPost } from "inversify-express-utils";
import { JsonResult } from "inversify-express-utils/dts/results";
import { ENVKEY, ORG, SDK, OnboardType, CodeGenerationStatus, CodeGenerationDBColumn } from "../common";
import { listOpenPullRequest, Onboard } from "../codegen";
import { SubmitPullRequest } from "../depthcoverage/Onboard";
import { Request, Response, response } from "express";
import { getCodeGeneration, UpdateCodeGenerationValue } from "../lib/CodeGeneration";
import CodeGenerateHandler from "../lib/CodeGenerateHandler";

@controller("/codegenerate")
export class CodeGenerateController extends BaseHttpController{
    public token: string = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];;
    public constructor(tk: string = undefined) {
        super();
        if (tk !== undefined) this.token = tk;
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
        let prlink:string = undefined;
        let err:any = undefined;
        try {
            const pulls: string[] = await listOpenPullRequest(this.token, org, repo, branch, basebranch);
            if (pulls.length > 0) {
                prlink= pulls[0]
            } else {
                let {prlink:ret, err:e} = await SubmitPullRequest(this.token, org, repo, title, branch, basebranch);
                prlink = ret;
                err = e;
            }
        }catch(e) {
            console.log(e);
            err = e;
        }

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

    /*generate source code. */
    @httpPost("/resourceProvider/:rpname/sdk/:sdk/generate")
    public async GenerateSDK(request: Request): Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const rp = request.params.rpname;
        const sdk:string = request.params.sdk;

        let sdkorg:string = request.body.org;
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

        let type = request.body.type;
        if (type === undefined) {
            type = OnboardType.ADHOC_ONBOARD;
        }
        let {codegen:cg, err:getErr} = await getCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                                process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                                process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                                process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                                rp,
                                                                sdk,
                                                                type);

        if (getErr === undefined && cg !== undefined && cg.status != CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED) {
            console.log("The code generation pipeline(" + rp + "," + sdk + ") is under " + cg.status + "Already. Ignore this trigger.");
            return this.json("Aleady Exists.", 201);
        }

        const err = await Onboard(rp, sdk, this.token, swaggerorg, sdkorg, type);

        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = "Trigger " + type + " for resource provider " + rp;
        }
        
        return this.json(content, statusCode);
    }

    /*cancel one code generation. */
    @httpPost("/resourceProvider/:rpname/sdk/:sdk/cancel")
    public async CancelCodeGenerationPOST(request: Request) : Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const rp = request.params.rpname;
        const sdk:string = request.params.sdk;
       
        let onbaordtype = request.body.type;
        if (onbaordtype === undefined) {
            onbaordtype = OnboardType.ADHOC_ONBOARD;
        }

        let codegenorg: string = request.body.codegenorg;
        if (codegenorg === undefined) {
            codegenorg = ORG.AZURE;
        }

        let sdkorg:string = request.body.org;
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

        const err = CodeGenerateHandler.CancelCodeGeneration(this.token, rp, sdk, onbaordtype, codegenorg, sdkorg, swaggerorg);
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
    }

    /*generate code snipper. */
    @httpPost("/resourceProvider/:rpname/sdk/:sdk/codeSnipper")
    public async GenerateCodeSnipperPOST(request: Request) {
        return this.json("Not Implemented", 200);
    }

    /*onboard one codegeneration, submit generated code to sdk repo and readme to swagger repo. */
    @httpPost("/resourceProvider/:rpname/sdk/:sdk/onboard")
    public async OnboardCodeGenerationPOST(request: Request): Promise<JsonResult> {
        // const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const rp = request.params.rpname;
        const sdk:string = request.params.sdk;
       
        let onbaordtype = request.body.type;
        if (onbaordtype === undefined) {
            onbaordtype = OnboardType.ADHOC_ONBOARD;
        }

        let codegenorg: string = request.body.codegenorg;
        if (codegenorg === undefined) {
            codegenorg = ORG.AZURE;
        }

        let sdkorg:string = request.body.org;
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
        const err = CodeGenerateHandler.SubmitGeneratedCode(rp, sdk, this.token, swaggerorg, sdkorg, onbaordtype);

        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = "Onboard " + onbaordtype + " for resource provider " + rp;
        }
        
        return this.json(content, statusCode);
    }

    /*customize an code generation. */
    @httpPost("/resourceProvider/:rpname/sdk/:sdk/customize")
    public async CustomizeCodegenerationPOST(request: Request): Promise<JsonResult> {
        const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const rp = request.params.rpname;
        const sdk = request.params.sdk;
        const org = request.body.org as string;
        const triggerPR = request.body.triggerPR as string;
        const codePR = request.body.codePR as string;
        let excludeTest :boolean = false;
        if (request.query.excludeTest !== undefined) {
            excludeTest = Boolean(request.body.excludeTest);
        }
        let onbaordtype = request.body.type;
        if (onbaordtype === undefined) {
            onbaordtype = OnboardType.ADHOC_ONBOARD;
        }

        let {codegen, err} = await getCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                            rp,
                                                            sdk,
                                                            onbaordtype);

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
        const custmizeerr = CodeGenerateHandler.CustomizeCodeGeneration(token, rp, sdk, triggerPR, codePR, org, excludeTest);

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