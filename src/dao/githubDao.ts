import { inject, injectable } from 'inversify';
import { Octokit } from '@octokit/rest';
import { ENV } from '../config/env';
import { IRepoInfo, RepoInfo } from '../models/CodeGenerationModel';
import { MemoryFileSystem } from 'memory-fs';
import { InjectableTypes } from '../injectableTypes/injectableTypes';

@injectable()
export class GithubDao {
    @inject(InjectableTypes.Logger) private logger;

    public client: Octokit = new Octokit({
        auth: process.env[ENV.GITHUB_TOKEN],
    });

    public async getCurrentCommit(
        org: string,
        repo: string,
        branch: string = 'main'
    ) {
        const refData = (
            await this.client.git.getRef({
                owner: org,
                repo,
                ref: 'heads/' + branch,
            })
        ).data;
        const commitSha = refData.object.sha;
        const commitData = (
            await this.client.git.getCommit({
                owner: org,
                repo,
                commit_sha: commitSha,
            })
        ).data;
        return { commitSha, treeSha: commitData.tree.sha };
    }

    public async getBranch(org: string, repo: string, branch: string) {
        let branchData = undefined;
        let br = await this.client.repos.getBranch({
            owner: org,
            repo: repo,
            branch,
        });
        branchData = br.data;

        return branchData;
    }

    public async createBranch(
        org: string,
        repo: string,
        branch: string,
        commitSha: string
    ) {
        await this.client.git.createRef({
            owner: org,
            repo,
            ref: 'refs/heads/' + branch,
            sha: commitSha,
        });
    }

    public async createNewTree(
        owner: string,
        repo: string,
        fs: MemoryFileSystem,
        paths: string[],
        parentTreeSha: string
    ) {
        let tree = [];
        for (let p of paths) {
            let content = fs.readFileSync('/' + p).toString();
            let blob = {
                path: p,
                mode: '100644',
                type: 'blob',
                content: content,
            };
            tree.push(blob);
        }

        const { data } = await this.client.git.createTree({
            owner,
            repo,
            tree: tree,
            base_tree: parentTreeSha,
        });

        return data;
    }

    public async createNewCommit(
        org: string,
        repo: string,
        message: string,
        currentTreeSha: string,
        currentCommitSha: string
    ) {
        const newCommit = await this.client.git.createCommit({
            owner: org,
            repo,
            message,
            tree: currentTreeSha,
            parents: [currentCommitSha],
        });

        return newCommit.data;
    }

    public async setBranchToCommit(
        org: string,
        repo: string,
        branch: string,
        commitSha: string
    ) {
        await this.client.git.updateRef({
            owner: org,
            repo,
            ref: 'heads/' + branch,
            sha: commitSha,
        });
    }

    public async createPullRequest(
        org: string,
        repo: string,
        baseBranch: string,
        headBranch: string,
        title: string
    ): Promise<string> {
        let result = await this.client.pulls.create({
            owner: org,
            repo,
            title: title,
            head: headBranch,
            base: baseBranch,
        });

        return result.data.html_url;
    }

    public async deleteBranch(org: string, repo: string, branch: string) {
        try {
            await this.client.git.deleteRef({
                owner: org,
                repo,
                ref: 'heads/' + branch,
            });
        } catch (e) {
            this.logger.warn(
                `Delete Branch ${branch} Failed in ${org}/${repo}`,
                e
            );
        }
    }

    /**
     *
     * @param token The github access token
     * @param rp The resource provider
     * @param sdk The target sdk, terrform, cli or others
     * @param onbaordtype The onboard type, depth ad-hoc or others
     * @param codegenorg The codegen org
     * @param sdkorg The sdk org
     * @param swaggerorg The swagger org
     * @returns
     */
    public async clearSDKCodeGenerationWorkSpace(
        rp: string,
        sdk: string,
        onbaordtype: string,
        codegenrepo: RepoInfo,
        sdkrepo: RepoInfo,
        swaggerrepo: RepoInfo,
        branch?: string
    ): Promise<void> {
        if (branch === undefined) {
            branch = onbaordtype + '-' + sdk.toLowerCase() + '-' + rp;
        }
        /* delete depth-coverage rp branch */
        const { org: cgorg, repo: cgreop } = this.getGitRepoInfo(codegenrepo);
        await this.deleteBranch(cgorg, cgreop, branch);

        const { org: sdkorg, repo: sdkreponame } = this.getGitRepoInfo(sdkrepo);
        await this.deleteBranch(sdkorg, sdkreponame, branch);
        let codebranch = branch + '-code';
        await this.deleteBranch(sdkorg, sdkreponame, codebranch);

        /*delete swagger rp branch */
        const { org: swaggerorg, repo: swagger_repo } = this.getGitRepoInfo(
            swaggerrepo
        );
        await this.deleteBranch(swaggerorg, swagger_repo, branch);
    }

    public async readFileFromRepo(
        org: string,
        repo: string,
        branch: string,
        fs: MemoryFileSystem,
        filename: string
    ): Promise<string> {
        const content = await this.getBlobContent(org, repo, branch, filename);
        fs.writeFileSync('/' + filename, content);
        return content;
    }

    public async getTree(owner: string, repo: string, tree_sha: string) {
        const treeData = (
            await this.client.git.getTree({
                owner,
                repo,
                tree_sha,
            })
        ).data;

        return treeData;
    }

    public async getBlobContent(
        org: string,
        repo: string,
        branch: string,
        filepath: string
    ) {
        const currentCommit = await this.getCurrentCommit(org, repo, branch);

        const treeData = await this.getTree(org, repo, currentCommit.treeSha);

        let content: string = '';
        const dirs: string[] = filepath.split('/');
        const filename = dirs.pop();
        let curtree = treeData;
        for (let dir of dirs) {
            let found: boolean = false;
            for (let t of curtree.tree) {
                if (t.path === dir) {
                    curtree = await this.getTree(org, repo, t.sha);
                    found = true;
                    break;
                }
            }
            if (!found) return '';
        }
        for (let t of curtree.tree) {
            if (t.path === filename) {
                const blobdata = (
                    await this.client.git.getBlob({
                        owner: org,
                        repo,
                        file_sha: t.sha,
                    })
                ).data;

                let buff = Buffer.from(blobdata.content, 'base64');
                content = buff.toString('utf-8');
                break;
            }
        }

        return content;
    }

    public async uploadToRepo(
        fs: MemoryFileSystem,
        filepaths: string[],
        org: string,
        repo: string,
        branch: string = 'main'
    ) {
        const currentCommit = await this.getCurrentCommit(org, repo, branch);
        const newTree = await this.createNewTree(
            org,
            repo,
            fs,
            filepaths,
            currentCommit.treeSha
        );

        const commitMessage = 'My commit message';

        const newCommit = await this.createNewCommit(
            org,
            repo,
            commitMessage,
            newTree.sha,
            currentCommit.commitSha
        );

        await this.setBranchToCommit(org, repo, branch, newCommit.sha);
    }

    public async readCustomizeFiles(
        org: string,
        repo: string,
        prNumber: number,
        fs: MemoryFileSystem,
        fileList: string[]
    ): Promise<string> {
        const prdata = await this.getPullRequest(org, repo, prNumber);
        const headbranch = prdata.head.ref;
        let retrievedFileLst: string[] = [];
        for (let file of fileList) {
            const content = await this.getBlobContent(
                org,
                repo,
                headbranch,
                file
            );
            if (content.length > 0) {
                retrievedFileLst.push(file);
                fs.writeFileSync('/' + file, content);
            }
        }

        return retrievedFileLst.join(';');
    }

    public async getPullRequest(org: string, repo: string, pullNumber: number) {
        const pullData = await this.client.pulls.get({
            owner: org,
            repo,
            pull_number: pullNumber,
        });

        return pullData.data;
    }

    public getGitRepoInfo: IRepoInfo = (repoInfo) => {
        if (repoInfo === undefined || repoInfo === null)
            return { org: undefined, repo: undefined };
        const parts: string[] = repoInfo.path.split('/');
        const len = parts.length;
        if (len <= 2) return { org: undefined, repo: undefined };
        return { org: parts[len - 2], repo: parts[len - 1] };
    };

    /* list pull request. */
    public async listOpenPullRequest(
        org: string,
        repo: string,
        head: string,
        base: string
    ): Promise<string[]> {
        return await this.listPullRequest(
            org,
            repo,
            'open',
            org + ':' + head,
            base
        );
    }

    public async listPullRequest(
        org: string,
        repo: string,
        state: any,
        head: string,
        base: string
    ): Promise<string[]> {
        let pullurls: string[] = [];
        const pulls = await this.client.pulls.list({
            owner: org,
            repo,
            state,
            head,
            base,
        });

        for (let pull of pulls.data) {
            pullurls.push(pull.html_url);
        }

        return pullurls;
    }

    public async submitPullRequest(
        org: string,
        repo: string,
        title: string,
        branchName: string,
        basebranch: string
    ): Promise<string> {
        const prlink = await this.createPullRequest(
            org,
            repo,
            basebranch,
            branchName,
            title
        );

        return prlink;
    }

    public async isMergedPullRequest(prlink: string): Promise<boolean> {
        const prpaths: string[] = prlink.split('/');
        const pullNumber = Number(prpaths.pop());
        prpaths.pop();
        const repo = prpaths.pop();
        const org = prpaths.pop();

        const prdata = await this.checkIfMergedPullRequest(
            org,
            repo,
            pullNumber
        );
        return prdata.statusCode === 204;

        return false;
    }

    public async checkIfMergedPullRequest(
        org: string,
        repo: string,
        pullNumber: number
    ): Promise<any> {
        const pullData = await this.client.pulls.checkIfMerged({
            owner: org,
            repo,
            pull_number: pullNumber,
        });

        return pullData;
    }
}
