import { ORG, SDK, README, REPO } from "./common";
import {uploadToRepo, createPullRequest, getBlobContent, NewOctoKit, getCurrentCommit, createBranch, deleteBranch, getBranch, getPullRequest, listBranchs, listPullRequest, deleteFile} from "gitrestutil/GitAPI"
import { TriggerOnboard, DeletePipelineBranch, DeleteAllDepthBranchs, submit} from "depthcoverage/dist/Onboard"
import { ResourceAndOperation} from "depthcoverage/dist/QueryDepthCoverageReport"

export async function ReadCustomizeFiles(token: string, org: string, repo: string, prNumber: number, fileList:string[]): Promise<string> {
    const octo = NewOctoKit(token);
    const RESOUCEMAPFile = "ToGenerate.json";
    const prdata = await getPullRequest(octo, org, repo, prNumber);
    const headbranch = prdata.head.ref;
    // const content = await getBlobContent(octo, org, repo, headbranch, RESOUCEMAPFile);
    const fs = require('fs');
    for (let file of fileList) {
        const content = await getBlobContent(octo, org, repo, headbranch, file);
        fs.writeFileSync(file, content);
    }

    return fileList.join(";");
}

export async function ReadFileFromPR(token: string, org: string, repo: string, prNumber: number, filename:string): Promise<string> {
    const octo = NewOctoKit(token);
    const prdata = await getPullRequest(octo, org, repo, prNumber);
    const headbranch = prdata.head.ref;
    const content = await getBlobContent(octo, org, repo, headbranch, filename);
    const fs = require('fs');
    fs.writeFileSync(filename, content);
    return content;
}

export async function ReadFileFromRepo(token: string, org: string, repo: string, branch:string, filename:string): Promise<string> {
    const octo = NewOctoKit(token);
    const content = await getBlobContent(octo, org, repo, branch, filename);
    const fs = require('fs');
    fs.writeFileSync(filename, content);
    return content;
}

export async function DeleteFilesFromRepo(token: string, org: string, repo: string, branch:string, filelist:string[]) {
    const octo = NewOctoKit(token);
    try {
        deleteFile(octo, org, repo, branch, filelist[0]); 
    } catch (e) {
        console.log(e);
    }
    
}

export async function Customize(token:string, rp: string, sdk: string, triggerPR: string, codePR: string, org: string = undefined, excludeTest: boolean = false) {
    const octo = NewOctoKit(token);
    // const org = ORG.AZURE;
    let sdkorg = ORG.AZURE;
    sdk = sdk.toLowerCase();
    if (sdk === SDK.TF_SDK) {
        sdkorg = ORG.MS;
        sdk = sdk.toLowerCase();
    }

    const branch = "depth-" + sdk + "-" + rp;

    let sdkrepo = "";
    let readfile = README.CLI_README_FILE;
    if (sdk === SDK.TF_SDK) {
        sdkrepo = REPO.TF_PROVIDER_REPO;
        readfile = README.TF_README_FILE;
    } else if (sdk === SDK.CLI_CORE_SDK) {
        sdkrepo = REPO.CLI_REPO;
    }

    const jsonMapFile: string = "ToGenerate.json";
    const fs = require('fs');
    let filepaths: string[] = [];

    let content = await ReadFileFromRepo(token, ORG.AZURE, REPO.DEPTH_COVERAGE_REPO, branch, jsonMapFile);
    /* exclude test. */
    if (content !== undefined && content.length > 0) {
        //let content = fs.readFileSync(jsonMapFile);
        let resource:ResourceAndOperation = JSON.parse(content);
        let excludes: string[] = [];
        if (resource.excludeStages !== undefined && resource.excludeStages.length > 0) excludes = resource.excludeStages.split(";");
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
            let newArray = excludes.filter(item => item == "MockTest" || item == "LiveTest");
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
    const filelist:string[] = [readfile, "schema.json"];
    await ReadCustomizeFiles(token, org !== undefined ? org :sdkorg, sdkrepo, +prNumber, filelist);

    
    /* copy configuration to swagger repo */
    
    
    console.log(__dirname);
    const specpath = "specification/" + rp + "/resource-manager";
    if (!fs.existsSync(specpath)){
        fs.mkdirSync(specpath, { recursive: true });
    }
    const swaggerReadMePath = "specification/" + rp + "/resource-manager/" + readfile;
    fs.copyFile(readfile, swaggerReadMePath, (err) => { 
        if (err) { 
        console.log("Error Found:", err); 
        } 
        else { 
        
        // Get the current filenames 
        // after the function 
        fs.readdirSync(__dirname).forEach(file => { 
            console.log(file); 
        }); 
        console.log("\nFile Contents of copied_file:");
        } 
    });

    filepaths.push(swaggerReadMePath);

    if (sdk === SDK.TF_SDK) {
        const schemapath = "schema.json";
        const swaggerSchemaPath = "specification/" + rp + "/resource-manager/" + schemapath;
        fs.copyFile(schemapath, swaggerSchemaPath, (err) => { 
            if (err) { 
                console.log("Error Found:", err); 
            } 
            else { 
                // Get the current filenames 
                // after the function 
                fs.readdirSync(__dirname).forEach(file => { 
                    console.log(file); 
                }); 
                console.log("\nFile Contents of copied_file:");
            } 
        });
        filepaths.push(swaggerSchemaPath);
    }

    try {
        /* update depth-coverage-pipeline trigger pull request. */
        await uploadToRepo(octo, filepaths, ORG.AZURE, REPO.DEPTH_COVERAGE_REPO, branch);
    } catch(e) {
        console.log(e);
    }
    


    /* delete sdk rp branch. */

}

export async function OnboardComplete(token: string, rp: string, sdk: string, org:string = undefined) {
    const azureorg = ORG.AZURE;
    sdk = sdk.toLowerCase();
    let sdkorg = ORG.AZURE;
    if (sdk === SDK.TF_SDK) {
        sdkorg = ORG.MS;
    }
    const branch = "depth-" + sdk + "-" + rp;
    /* delete depth-coverage rp branch */
    await DeletePipelineBranch(token, azureorg, REPO.DEPTH_COVERAGE_REPO, branch);

    /* delete sdk rp branch. */
    let sdkrepo = "";
    if (sdk === SDK.TF_SDK) {
        sdkrepo = REPO.SWAGGER_REPO;
    } else if (sdk === SDK.CLI_CORE_SDK) {
        sdkrepo = REPO.CLI_REPO;
    }
    await DeletePipelineBranch(token, org !== undefined ? org : sdkorg, sdkrepo, branch);

    /*delete swagger rp branch */
    await DeletePipelineBranch(token, azureorg, REPO.SWAGGER_REPO, branch);
}

/* trigger a RP onboard. */
export async function TriggerOnboard(rp:string, sdk:string, token: string, org: string, repo: string, basebranch: string = 'main') {
    try {
        const fs = require('fs');
        const RESOUCEMAPFile = "ToGenerate.json";
        const octo = NewOctoKit(token);
        const branchName = "onboard-" + sdk + "-" + rp;
        const baseCommit = await getCurrentCommit(octo, org, repo, basebranch);
        const targetBranch = await getBranch(octo, org, repo, branchName);
        if (targetBranch !== undefined) {
            console.log("resource branch already exist.")
            return;
        }
        await createBranch(octo, org, repo, branchName, baseCommit.commitSha);
        // fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rs, null, 2));
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

/* onboard a RP. */
export async function Onboard(rp:string, sdk:string, token: string, swaggerorg:string = undefined, org:string = undefined) {
    try {
        const octo = NewOctoKit(token);
        /* generate PR in swagger repo. */
        let basebranch="master"
        sdk = sdk.toLowerCase();
        let branch = "depth-" + sdk + "-" + rp;
        
        await createPullRequest(octo, swaggerorg !== undefined ? swaggerorg: ORG.AZURE, REPO.SWAGGER_REPO, basebranch, branch, "[Depth Coverage, " + rp+ "]pull request from pipeline " + branch);

        /* generate PR in sdk code repo. */
        let sdkrepo = "";
        let sdkbasebranch = "master";
        let sdkorg = ORG.AZURE;
        if (sdk === SDK.TF_SDK) {
            sdkrepo = REPO.SWAGGER_REPO;
            sdkorg = ORG.MS;
        } else if (sdk === SDK.CLI_CORE_SDK) {
            sdkrepo = REPO.CLI_REPO;
            sdkbasebranch="dev";
        }
         await createPullRequest(octo, org !== undefined ? org : sdkorg, sdkrepo, sdkbasebranch, branch, "[Depth Coverage, " + rp+ "]pull request from pipeline " + branch);

    } catch(err) {
        console.log(err);
    }
}

/* list pull request. */
export async function listOpenPullRequest(token: string, org: string, repo: string, head: string, base:string):Promise<string[]> {
    const octo = NewOctoKit(token);
    return listPullRequest(octo, org, repo, "open", org + ":" + head, base);
    // let result:string[] = [];
    // return result;
}