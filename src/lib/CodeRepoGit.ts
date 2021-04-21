import { NewOctoKit, deleteBranch, getPullRequest, getBlobContent, deleteFile, createPullRequest, listPullRequest } from "../gitutil/GitAPI";

export async function DeleteBranch(token: string, org: string, repo: string, branch: string) :Promise<any> {
    try {
        const octo = NewOctoKit(token);
        await deleteBranch(octo, org, repo, branch);
    } catch(err) {
        console.log(err);
        return err;
    }
    
    return undefined;
}

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

export async function SubmitPullRequest(token: string, org: string, repo: string, title: string, branchName: string, basebranch: string): Promise<{prlink:string, err:any}> {
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

/* list pull request. */
export async function listOpenPullRequest(token: string, org: string, repo: string, head: string, base:string):Promise<string[]> {
    const octo = NewOctoKit(token);
    return listPullRequest(octo, org, repo, "open", org + ":" + head, base);
    // let result:string[] = [];
    // return result;
}