#!/usr/bin/env node

import { QueryDepthCoverageReport, Operation, ResourceAndOperation, DepthCoverageType, ConvertOperationToDepthCoverageResourceAndOperation, ConvertResourceToDepthCoverageResourceAndOperation, AutorestSDK, CandidateResources } from "./QueryDepthCoverageReport";
import { fstat } from "fs";
import { RetriveResourceToGenerate, DeletePipelineBranch, ReadPR, ReadPRFiles } from "./Onboard";
import {uploadToRepo, createPullRequest, getBlobContent, NewOctoKit, getCurrentCommit, createBranch, deleteBranch, getBranch, getPullRequest} from "../gitutil/GitAPI"

async function GetResources(dbserver: string, db:string, dbuser: string, dbpw: string, sdk:string=undefined) {
    let resources;
    if (sdk === undefined) {
        const tfresources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE);
        const cliresources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION);
        resources = tfresources.concat(cliresources);
    } else {
        if (sdk === AutorestSDK.AUTOREST_SDK_TF) {
            resources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE);
        } else {
            resources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION);
        }
        
    }
    

    let RESOUCEMAPFile = "Candidate.json";
    if (sdk !== undefined) {
        RESOUCEMAPFile = sdk + "-Candidate.json"
    }
    const fs = require('fs');
    fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(resources));

}

async function SubmitPR(dbserver: string, db:string, dbuser: string, dbpw: string, token: string, org: string, repo: string, basebranch: string = 'main') {
    // const tfresources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE);

    // const cliresources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION);

    // let resources = tfresources.concat(cliresources);
    const supportedService:Set<string> = new Set(["compute", "network"]);
    const supportedResource:CandidateResources[] = [];
    supportedResource.push(new CandidateResources("compute", "ALL"));
    supportedResource.push(new CandidateResources("network", "ALL"));
    let resources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION, supportedResource);

    const RESOUCEMAPFile = "ToGenerate.json";
    const octo = NewOctoKit(token);

    const fs = require('fs');
    for (let rs of resources) {
        try {
            const baseCommit = await getCurrentCommit(octo, org, repo, basebranch);
            const targetBranch = await getBranch(octo, org, repo, rs.RPName);
            if (targetBranch !== undefined) {
                console.log("resource branch already exist.")
                continue;
            }
            await createBranch(octo, org, repo, rs.RPName, baseCommit.commitSha);
            fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rs));
            await uploadToRepo(octo, ["ToGenerate.json"], org, repo, rs.RPName);
            /* create pull request. */
            await createPullRequest(octo, org, repo, basebranch, rs.RPName, "pull request from branch " + rs.RPName);
    
            // let pullData = await getPullRequest(octo, org, repo, 6);
            // console.log(pullData);
    
            // let commitData = await getCommit(octo, org, repo, "6ae620b1fa2c528e7737c81020fed22dd94356b3");
            // console.log(commitData);
    
            let content = await getBlobContent(octo, org, repo, rs.RPName, RESOUCEMAPFile);
            console.log(content);

            // await deleteBranch(octo, org, repo, rs.RPName);
            
        } catch(err) {
            console.log(err);
        }
    }
}



const main = async() => {
    const args = parseArgs(process.argv);
    const op = args["operation"];
    const token = args["token"];
    const org = args["org"];
    const repo = args["repo"];
    // const base = args["base"];

    if (
        !token ||
        !org ||
        !repo 
    ) {
        throw new Error("Toksn Missing required parameter");
    }
    if (op !== undefined) {
        if (op === "submitPR") {
            const dbserver=args["DBServer"];
            const db=args["Database"];
            const dbuser = args["DBUsername"];
            const dbpw = args["DBPassword"];
            if (
                !dbserver ||
                !db ||
                !dbuser ||
                !dbpw 
            ) {
                throw new Error("Missing required parameter");
            }
            console.log(token + "," + org + "," + repo);
            await SubmitPR(dbserver, db, dbuser, dbpw, token, org, repo);
        } else if (op === "readPR") {
            if (!args["PRNumber"]) {
                throw new Error("Missing required parameter");
            }
            const prNumber:number = +args["PRNumber"];
            const datastr = await ReadPR(token, org, repo, prNumber);
            const data = JSON.parse(datastr);
            console.log(data);
            process.env.RPNAME = data["PRName"];
            process.env.RESOUCEMAP = datastr;
            return data;
        } else if (op === "deleteBranch") {
            if (!args["branch"]) {
                throw new Error("Missing required parameter");
            }

            const branch = args["branch"];
            await DeletePipelineBranch(token, org, repo, branch);
        } else if (op === "getResources") {
            const dbserver=args["DBServer"];
            const db=args["Database"];
            const dbuser = args["DBUsername"];
            const dbpw = args["DBPassword"];
            const sdk = args["sdk"];
            if (
                !dbserver ||
                !db ||
                !dbuser ||
                !dbpw 
            ) {
                throw new Error("Missing required parameter");
            }
            console.log(token + "," + org + "," + repo);
            GetResources(dbserver, db, dbuser, dbpw, sdk);
        } else if (op === "read") {
            if (!args["PRNumber"]) {
                throw new Error("Missing required parameter");
            }
            const prNumber:number = +args["PRNumber"];
            await ReadPRFiles(token, org, repo, prNumber);
        }
    }
    
}

/**
 * Parse a list of command line arguments.
 * @param argv List of cli args(process.argv)
 */
const FLAG_REGEX = /^--([^=:]+)([=:](.+))?$/;
export const parseArgs = (argv: string[]) => {
    const result: any = {};
    for (const arg of argv) {
        const match = FLAG_REGEX.exec(arg);
        if (match) {
            const key = match[1];
            const rawValue = match[3];
            result[key] = rawValue;
        }
    }
    return result;
}

const ret = main();