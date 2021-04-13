import { httpGet, controller, httpPost, BaseHttpController, httpPut } from "inversify-express-utils";
import { check } from "express-validator/check";
import { IngestCandidates } from "../CandidateService";
import { Request, Response, response } from "express";
import { ENVKEY, ORG, SDK, REPO } from "../common";
import { request } from "http";
import { JsonResult } from "inversify-express-utils/dts/results";
import { TriggerOnboard, DeletePipelineBranch } from "../depthcoverage/Onboard";
// import { JsonResult } from "inversify-express-utils/dts/results/index"

@controller("/depthCoverage")
export class DepthCoverageController extends BaseHttpController{
    @httpGet("/")
    public hello(): string{
        return "HelloWorld";
    }

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

    @httpPost("/trigger")
    public async Trigger(req: Request) : Promise<JsonResult> {
        const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const org = req.body.org;
        const repo = req.body.repo;
        const dbserver=process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
        const db=process.env[ENVKEY.ENV_DEPTH_DATABASE];
        const dbuser = process.env[ENVKEY.ENV_DEPTH_DB_USER];
        const dbpw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
        const candidate = req.body.candidateResources;
        const platform = req.body.platform;
        let branch = "main";
        let type = "depth";
        if (platform !== undefined && platform.toLowerCase() === "dev") {
            branch = "dev";
            type = "dev";
        }
        if (
            !dbserver ||
            !db ||
            !dbuser ||
            !dbpw 
        ) {
            throw new Error("Missing required parameter");
        }
        console.log(token + "," + org + "," + repo);
        const err = await TriggerOnboard(dbserver, db, dbuser, dbpw, token, org, repo, branch, candidate, type);
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

    @httpPost("/resourceProvider/:rpname/sdk/:sdk/complete", check("request").exists())
    public async Complete(request: Request): Promise<JsonResult> {
        const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
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
        const branch = "depth-" + sdk.toLowerCase() + "-" + rp;
        /* delete depth-coverage rp branch */
        let err = await DeletePipelineBranch(token, org, REPO.DEPTH_COVERAGE_REPO, branch);
        

        /* delete sdk rp branch. */
        let sdkrepo = "";
        if (sdk === SDK.TF_SDK) {
            sdkrepo = REPO.TF_PROVIDER_REPO;
        } else if (sdk === SDK.CLI_CORE_SDK) {
            sdkrepo = REPO.CLI_REPO;
        }
        try {
            await DeletePipelineBranch(token, sdkorg, sdkrepo, branch);
            let codebranch = "depth-code-" + sdk.toLowerCase() + "-" + rp;
            await DeletePipelineBranch(token, sdkorg, sdkrepo, codebranch);
        } catch(e) {
            console.log("Failed to delete sdk branch: " + branch);
            console.log(e);
        }

        /*delete swagger rp branch */
        try {
            await DeletePipelineBranch(token, swaggerorg != undefined ? swaggerorg: org, REPO.SWAGGER_REPO, branch);
        } catch(e) {
            console.log("Failed to delete swagger branch: " + branch);
            console.log(e);
        }

        let content = {};
        let statusCode = 200;
        if (err !== undefined) {
            statusCode = 400;
            content = {error: err};
        } else {
            statusCode = 200;
            content = rp + " " + sdk + ' onboarding is completed.';
        }
        
        return this.json(content, statusCode);
    }
}

