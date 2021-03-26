#!/usr/bin/env node

import { NewOctoKit, getBlobContent, uploadToRepo, createPullRequest, getPullRequest, getCommit, listBranchs, deleteFile, readCurrentCommitContent } from "./GitAPI";

const main = async() => {
    // let token = process.argv.pop();
    // console.log(token);  

    // const ORGANIZATION = 'Azure';
    // const REPO = 'depth-coverage-pipeline';
    

    const args = parseArgs(process.argv);
    const token = args["token"];
    const ORGANIZATION = args["org"];
    const REPO = args["repo"];
    const branch = args["branch"];

    console.log(token + "," + ORGANIZATION + "," + REPO);

    // if (!repos.data.map((repo: Octokit.ReposListForOrgResponseItem) => repo.name).includes(REPO)) {
    //     await createRepo(octo, ORGANIZATION, REPO);
    // }

    try {
        const octo = NewOctoKit(token);
        // const repos = await octo.repos.listForOrg({
        //     org: ORGANIZATION
        // });
        // await uploadToRepo(octo, ["ToGenerate.json", "readme.trenton.md"], ORGANIZATION, REPO, branch);
        // /* create pull request. */
        // await createPullRequest(octo, ORGANIZATION, REPO, "main", "config", "pull request from script");

        // let pullData = await getPullRequest(octo, ORGANIZATION, REPO, 6);
        // console.log(pullData);

        // // let commitData = await getCommit(octo, ORGANIZATION, REPO, "6ae620b1fa2c528e7737c81020fed22dd94356b3");
        // // console.log(commitData);

        // let content = await getBlobContent(octo, ORGANIZATION, REPO, "config", "ToGenerate.json");
        // console.log(content);

        // let branches = await listBranchs(octo, ORGANIZATION, REPO);
        // console.log(branches);
        await deleteFile(octo, "Azure", "depth-coverage-pipeline", "config", "ToGenerate.json");
        // await readCurrentCommitContent(octo, ORGANIZATION, REPO, "depth-clicore-network", ["ToGenerate.json","readme.az.md"]);
        
    } catch(err) {
        console.log(err);
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

main();