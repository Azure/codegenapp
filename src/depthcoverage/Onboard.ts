import { Operation, DepthCoverageType, AutorestSDK, QueryCandidateResources, QueryDepthCoverageReport, ConvertOperationToDepthCoverageResourceAndOperation, ConvertResourceToDepthCoverageResourceAndOperation, CandidateResource } from "./QueryDepthCoverageReport";
import {uploadToRepo, createPullRequest, getBlobContent, NewOctoKit, getCurrentCommit, createBranch, deleteBranch, getBranch, getPullRequest, listBranchs, readCurrentCommitContent} from "../gitutil/GitAPI"
import { ResourceAndOperation } from "../common";

export async function RetriveResourceToGenerate(server: string, db: string, user: string, pw: string, depthcoverageType: string, supportedResources:CandidateResource[] = undefined) : Promise<ResourceAndOperation[]>{
    const opOrresources:any[] = await QueryDepthCoverageReport(server, db, user, pw, depthcoverageType);
    //const supportedResource:Set<string> = new Set(["Microsoft.Security/devices", "Microsoft.Consumption/marketplaces", "Microsoft.CertificateRegistration/certificateOrders"]);
    // const supportedService:Set<string> = new Set(["compute", "authorization", "storage", "sql", "web", "keyvault","network", "resources"]);
    // const supportedService:Set<string> = new Set(["compute", "network"]);
    /*TODO: get the supported service from db. */

    let sdk = "";
    if (depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
        depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE) {
        sdk = AutorestSDK.AUTOREST_SDK_CLI_CORE;
    } else {
        sdk = AutorestSDK.AUTOREST_SDK_TF;
    }
    if (depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION 
        || depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION) {
        const res:ResourceAndOperation[] = await ConvertOperationToDepthCoverageResourceAndOperation(opOrresources, sdk, supportedResources);
        console.log(res);
        
        return res;
    } else {
        const res:ResourceAndOperation[] = await ConvertResourceToDepthCoverageResourceAndOperation(opOrresources, sdk, supportedResources);
        console.log(res);
        
        return res;
    }
    
}
export async function DeleteAllDepthBranchs(token: string, org: string, repo: string) {
    const octo = NewOctoKit(token);
    let branches:string[] = await listBranchs(octo, org, repo);
    for (let branch of branches) {
        if (branch.startsWith("depth")) {
            await DeletePipelineBranch(token, org, repo, branch);
        }
    }
}

export async function DeletePipelineBranch(token: string, org: string, repo: string, branch: string) {
    const octo = NewOctoKit(token);
    await deleteBranch(octo, org, repo, branch);
}

export async function TriggerOnboard(dbserver: string, db:string, dbuser: string, dbpw: string, token: string, org: string, repo: string, basebranch: string = 'main', supported:string[] = undefined) {
    let tfsupportedResource:CandidateResource[] = undefined;
    const tfcandidates = await QueryCandidateResources(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE);
    if (tfcandidates.length > 0 || (supported !== undefined && supported.length > 0)) {
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
    const tfresources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE, tfsupportedResource);

    let clisupportedResource:CandidateResource[] = undefined;
    const clicandidates = await QueryCandidateResources(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION);
    if (clicandidates.length > 0 || (supported !== undefined && supported.length > 0)) {
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

    const cliresources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION, clisupportedResource);

    let resources = tfresources.concat(cliresources);
    // let resources = await RetriveResourceToGenerate(dbserver, db, dbuser, dbpw, DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION);

    const RESOUCEMAPFile = "ToGenerate.json";
    const octo = NewOctoKit(token);

    const fs = require('fs');
    for (let rs of resources) {
        try {
            rs.generateResourceList();
            const branchName = "depth-" + rs.target + "-" + rs.RPName;
            const baseCommit = await getCurrentCommit(octo, org, repo, basebranch);
            const targetBranch = await getBranch(octo, org, repo, branchName);
            if (targetBranch !== undefined) {
                console.log("resource branch already exist.")
                continue;
            }
            await createBranch(octo, org, repo, branchName, baseCommit.commitSha);
            fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rs, null, 2));
            await uploadToRepo(octo, ["ToGenerate.json"], org, repo, branchName);
            /* create pull request. */
            await createPullRequest(octo, org, repo, basebranch, branchName, "pull request from branch " + branchName);
    
            // let pullData = await getPullRequest(octo, org, repo, 6);
            // console.log(pullData);
    
            // let commitData = await getCommit(octo, org, repo, "6ae620b1fa2c528e7737c81020fed22dd94356b3");
            // console.log(commitData);
    
            let content = await getBlobContent(octo, org, repo, branchName, RESOUCEMAPFile);
            console.log(content);

            // await deleteBranch(octo, org, repo, branchName);
            
        } catch(err) {
            console.log(err);
        }
    }
}

export async function ReadPR(token: string, org: string, repo: string, prNumber: number): Promise<string> {
    const octo = NewOctoKit(token);
    const RESOUCEMAPFile = "ToGenerate.json";
    const prdata = await getPullRequest(octo, org, repo, prNumber);
    const headbranch = prdata.head.ref;
    const content = await getBlobContent(octo, org, repo, headbranch, RESOUCEMAPFile);
    const fs = require('fs');
    fs.writeFileSync(RESOUCEMAPFile, content);
    return content;
}

export async function ReadPRFiles(token: string, org: string, repo: string, prNumber: number){
    const octo = NewOctoKit(token);
    const prdata = await getPullRequest(octo, org, repo, prNumber);
    const headbranch = prdata.head.ref;
    await readCurrentCommitContent(octo, org, repo, headbranch, ["ToGenerate.json","readme.az.md", "schema.json"]);
}

export async function submit(token: string, org: string, repo: string, title: string, branchName: string, basebranch: string): Promise<{prlink:string, err:any}> {
    const octo = NewOctoKit(token);
    
    let prlink = ""
    let err = undefined;
    try {
        await createPullRequest(octo, org, repo, basebranch, branchName, title);
    } catch(e) {
        console.log(e);
        err = e;
        return {prlink, err};
    }
    
    return {prlink, err};
}