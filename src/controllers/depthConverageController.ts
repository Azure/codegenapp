import { httpGet, controller, httpPost, BaseHttpController } from "inversify-express-utils";
import { check } from "express-validator/check";
import { IngestCandidates } from "../CandidateService";
import { JsonResult } from "inversify-express-utils/dts/results";
import { Request, Response } from "express";
import { ENVKEY } from "../common";

@controller("/depthCoverage")
export class DepthCoverageController extends BaseHttpController{
    @httpGet("/")
    public hello(): string{
        return "HelloWorld";
    }

    @httpPost("/sdk/:sdk/candidates", check("request").exists())
    public async Candidates(request: Request) :Promise<JsonResult> {
        let res: Response = new Response();
        const dbserver=process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
        const db=process.env[ENVKEY.ENV_DEPTH_DATABASE];
        const dbuser = process.env[ENVKEY.ENV_DEPTH_DB_USER];
        const dbpw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
        const sdk = request.params.sdk;
        if (
            !dbserver ||
            !db ||
            !dbuser ||
            !dbpw 
        ) {
            //throw new Error("Missing required parameter");
            res.statusCode = 400;
            res.send("Missing required parameter");
        }
        let candidates = request.body.candidates;
        //let table = req.body.table;
        const err = await IngestCandidates(candidates, dbserver, db, dbuser, dbpw, sdk);

        if (err !== undefined) {
            res.statusCode = 400;
            res.send("error");
        } else {
            res.send("ingest candidate");
        }

        //return res;
        let result: JsonResult = new JsonResult("eror", 400, this);
        return result;
    }  
}