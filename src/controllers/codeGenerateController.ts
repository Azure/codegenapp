import { BaseHttpController, controller, httpPost } from "inversify-express-utils";
import { JsonResult } from "inversify-express-utils/dts/results";
import { ENVKEY } from "../common";
import { listOpenPullRequest } from "../codegen";
import { SubmitPullRequest } from "../depthcoverage/Onboard";
import { Request, Response, response } from "express";

@controller("/")
export class CodeGenerateController extends BaseHttpController{
    /* generate an pull request. */
    @httpPost("/generatePullRequest")
    public async GenerateCodePullRequest(request: Request): Promise<JsonResult> {
        const token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
        const org = request.body.org;
        const repo = request.body.repo;
        const title = request.body.title;
        const branch = request.body.branch;
        const basebranch = request.body.base;
        console.log("org:" + org + ",repo:" + repo + ",title:" + title + ",branch:" + branch + ",base:" + basebranch);
        let prlink:string = undefined;
        let err:any = undefined;
        try {
            const pulls: string[] = await listOpenPullRequest(token, org, repo, branch, basebranch);
            if (pulls.length > 0) {
                prlink= pulls[0]
            } else {
                let {prlink:ret, err:e} = await SubmitPullRequest(token, org, repo, title, branch, basebranch);
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
}