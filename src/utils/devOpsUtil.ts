import * as azdev from 'azure-devops-node-api';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import {
    GitCommit,
    GitQueryCommitsCriteria,
    GitRepositoryCreateOptions,
    GitTreeRef,
} from 'azure-devops-node-api/interfaces/GitInterfaces';
import { ConnectionData } from 'azure-devops-node-api/interfaces/LocationsInterfaces';
import { GitRepository } from 'azure-devops-node-api/interfaces/TfvcInterfaces';

export async function getApi(
    serverUrl: string,
    token: string
): Promise<azdev.WebApi> {
    return new Promise<azdev.WebApi>(async (resolve, reject) => {
        try {
            // let token = getEnv("API_TOKEN");
            let authHandler = azdev.getPersonalAccessTokenHandler(token);
            let option = undefined;

            let vsts: azdev.WebApi = new azdev.WebApi(
                serverUrl,
                authHandler,
                option
            );
            let connData: ConnectionData = await vsts.connect();
            console.log(
                `Hello ${connData.authenticatedUser.providerDisplayName}`
            );
            resolve(vsts);
        } catch (err) {
            reject(err);
        }
    });
}

export async function getWebApi(serverUrl?: string): Promise<azdev.WebApi> {
    serverUrl = serverUrl || getEnv('API_URL');
    return await getApi(serverUrl, getEnv('API_TOKEN'));
}

function getEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    return val;
}

export async function getGitApi(serverUrl: string): Promise<IGitApi> {
    let webApi: azdev.WebApi = await getWebApi(serverUrl);
    let gitApiObject: IGitApi = await webApi.getGitApi();

    return gitApiObject;
}

export async function getReposities(
    serverUrl: string,
    project: string
): Promise<GitRepository[]> {
    let repos: GitRepository[] = [];
    const gitApiObject = await getGitApi(serverUrl);
    repos = await gitApiObject.getRepositories(project);
    return repos;
}

export async function createRepository(
    serverUrl: string,
    project: string,
    reponame: string
): Promise<GitRepository> {
    const createOptions: GitRepositoryCreateOptions = { name: reponame };
    const gitApiObject = await getGitApi(serverUrl);
    let newRepo: GitRepository = await gitApiObject.createRepository(
        createOptions,
        project
    );

    return newRepo;
}

export async function getReposity(
    serverUrl: string,
    project: string,
    repoid: string
): Promise<GitRepository> {
    const gitApiObject = await getGitApi(serverUrl);
    const repo = await gitApiObject.getRepository(repoid, project);

    return repo;
}

export async function getReposityByName(
    serverUrl: string,
    project: string,
    reponame: string
): Promise<GitRepository> {
    const repos: GitRepository[] = await getReposities(serverUrl, project);
    for (let repo of repos) {
        if (repo.name === reponame) return repo;
    }

    return undefined;
}

export async function getPullRequest() {}

export async function readRepoFile(
    filepath: string,
    serverUrl: string,
    project: string,
    reponame: string,
    branch: string = 'main'
) {
    const gitApiObject = await getGitApi(serverUrl);
    let searchCriteria = {
        $top: 1,
        itemVersion: { version: branch },
    };
    // searchCriteria.itemVersion.version = branch;
    const repo = await getReposityByName(serverUrl, project, reponame);
    if (repo !== undefined) {
        let commits: GitCommit[] = await gitApiObject.getCommits(
            repo.id,
            searchCriteria,
            project,
            0,
            1
        );
        let commit: GitCommit = commits[0];
        let treesha = commit.treeId;
        let tree: GitTreeRef = await gitApiObject.getTree(
            repo.id,
            treesha,
            project
        );
        if (tree === undefined) {
            for (let item of tree.treeEntries) {
                if (item.relativePath === filepath) {
                    let content = await gitApiObject.getBlobContent(
                        repo.id,
                        item.objectId,
                        project
                    );
                    break;
                }
            }
        }
    }
}

// readFile("config/CLICandidate.csv", "https://dev.azure.com", "devdiv", "codegen-pipeline", "main");
