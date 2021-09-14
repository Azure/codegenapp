import { RepoInfo } from '../models/CodeGenerationModel';
import { MemoryFileSystem } from 'memory-fs';

export interface GithubDao {
    getCurrentCommit(org: string, repo: string, branch: string);
    createBranch(org: string, repo: string, branch: string, commitSha: string);
    createPullRequest(
        org: string,
        repo: string,
        baseBranch: string,
        headBranch: string,
        title: string
    );
    deleteBranch(org: string, repo: string, branch: string);
    clearSDKCodeGenerationWorkSpace(
        rp: string,
        sdk: string,
        onboardType: string,
        codegenRepo: RepoInfo,
        sdkRepo: RepoInfo,
        swaggerRepo: RepoInfo,
        branch?: string
    );
    readFileFromRepo(
        org: string,
        repo: string,
        branch: string,
        fs: MemoryFileSystem,
        filename: string
    );
    uploadToRepo(
        fs: MemoryFileSystem,
        filepaths: string[],
        org: string,
        repo: string,
        branch: string
    );
    readCustomizeFiles(
        org: string,
        repo: string,
        prNumber: number,
        fs: MemoryFileSystem,
        fileList: string[]
    );
    getGitRepoInfo(repoInfo: RepoInfo);
    listOpenPullRequest(org: string, repo: string, head: string, base: string);
    submitPullRequest(
        org: string,
        repo: string,
        title: string,
        branchName: string,
        basebranch: string
    );
    isMergedPullRequest(prlink: string);
    getBlobURL(commit: string, resourceProvider: string, repoInfo: RepoInfo);
}
