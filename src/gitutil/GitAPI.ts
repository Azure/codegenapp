import { Octokit } from "@octokit/rest";

export async function createRepo(octo: Octokit, org: string, name: string) {
  await octo.repos.createInOrg({ org, name, auto_init: true });
}

export async function uploadToRepo(
  octo: Octokit,
  filepaths: string[],
  org: string,
  repo: string,
  branch: string = "main"
) {
  // get commit's SHA and its tree's SHA
  // const currentCommit = await getCurrentCommit(octo, org, repo, branch);
  const currentCommit = await getCurrentCommit(octo, org, repo, branch);
  // await deleteBranch(octo, org, repo, "test");
  const newTree = await createNewTree(
    octo,
    org,
    repo,
    filepaths,
    currentCommit.treeSha
  );

  const commitMessage = "My commit message";

  const newCommit = await createNewCommit(
    octo,
    org,
    repo,
    commitMessage,
    newTree.sha,
    currentCommit.commitSha
  );

  await setBranchToCommit(octo, org, repo, branch, newCommit.sha);
}

export async function getCommit(
  octo: Octokit,
  org: string,
  repo: string,
  commitSha: string
) {
  const commitData = (
    await octo.git.getCommit({
      owner: org,
      repo,
      commit_sha: commitSha,
    })
  ).data;

  return commitData;
}

export async function getCurrentCommit(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string = "main"
) {
  // const {data: refData} = await octo.git.getRef({
  //     owner: org,
  //     repo,
  //     ref: 'heads/'+branch,
  // });

  const refData = (
    await octo.git.getRef({
      owner: org,
      repo,
      ref: "heads/" + branch,
    })
  ).data;
  const commitSha = refData.object.sha;
  const ref = refData.object.url;
  console.log(ref);

  // const {data: commitData} = await octo.git.getCommit({
  //     owner: org,
  //     repo,
  //     commit_sha: commitSha,
  // });

  const commitData = (
    await octo.git.getCommit({
      owner: org,
      repo,
      commit_sha: commitSha,
    })
  ).data;
  console.log(commitData.tree.url);
  return { commitSha, treeSha: commitData.tree.sha };
}

export async function createNewTree(
  octo: Octokit,
  owner: string,
  repo: string,
  paths: string[],
  parentTreeSha: string
) {
  let tree = [];
  const fs = require("fs");
  for (let path of paths) {
    // let content = JSON.parse(fs.readFileSync(path));
    let content = fs.readFileSync(path).toString();
    let blob = {
      path: path,
      mode: "100644",
      type: "blob",
      content: content,
    };
    tree.push(blob);
  }

  // let content = JSON.parse(fs.readFileSync(paths[0]));
  // const {data} = await octo.git.createTree({
  //     owner,
  //     repo,
  //     tree:[
  //         {
  //             path: paths[0],
  //             mode: "100644",
  //             type: "blob",
  //             content: JSON.stringify(content),
  //           },
  //     ],
  //     base_tree: parentTreeSha,
  // });
  const { data } = await octo.git.createTree({
    owner,
    repo,
    tree: tree,
    base_tree: parentTreeSha,
  });

  return data;
}

export async function getTree(
  octo: Octokit,
  owner: string,
  repo: string,
  tree_sha: string
) {
  const treeData = (
    await octo.git.getTree({
      owner,
      repo,
      tree_sha,
    })
  ).data;

  return treeData;
}

export async function createNewCommit(
  octo: Octokit,
  org: string,
  repo: string,
  message: string,
  currentTreeSha: string,
  currentCommitSha: string
) {
  const newCommit = await octo.git.createCommit({
    owner: org,
    repo,
    message,
    tree: currentTreeSha,
    parents: [currentCommitSha],
  });

  return newCommit.data;
}

export async function setBranchToCommit(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string,
  commitSha: string
) {
  await octo.git.updateRef({
    owner: org,
    repo,
    ref: "heads/" + branch,
    sha: commitSha,
  });

  // await octo.git.createRef({
  //     owner:org,
  //     repo,
  //     ref: 'refs/heads/' + branch,
  //     sha: commitSha,
  //   });
}

export async function createBranch(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string,
  commitSha: string
) {
  await octo.git.createRef({
    owner: org,
    repo,
    ref: "refs/heads/" + branch,
    sha: commitSha,
  });
}

export async function deleteBranch(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string
) {
  await octo.git.deleteRef({
    owner: org,
    repo,
    ref: "heads/" + branch,
  });
}

export async function getBranch(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string
) {
  let branchdata = undefined;
  try {
    let br = await octo.repos.getBranch({
      owner: org,
      repo: repo,
      branch,
    });
    branchdata = br.data;
  } catch (err) {
    console.log(err);
  }
  return branchdata;
}

export async function listBranchs(
  octo: Octokit,
  org: string,
  repo: string
): Promise<string[]> {
  let branches: string[] = [];
  try {
    let br = await octo.repos.listBranches({
      owner: org,
      repo: repo,
    });
    let branchesdata = br.data;
    for (let b of branchesdata) {
      branches.push(b.name);
    }
  } catch (err) {
    console.log(err);
  }

  return branches;
}

export async function createPullRequest(
  octo: Octokit,
  org: string,
  repo: string,
  baseBranch: string,
  headBranch: string,
  title: string
): Promise<string> {
  let result = await octo.pulls.create({
    owner: org,
    repo,
    title: title,
    head: headBranch,
    base: baseBranch,
  });

  return result.data.html_url;
}

export async function getPullRequest(
  octo: Octokit,
  org: string,
  repo: string,
  pullNumber: number
) {
  const pullData = await octo.pulls.get({
    owner: org,
    repo,
    pull_number: pullNumber,
  });

  return pullData.data;
}

export async function listPullRequest(
  octo: Octokit,
  org: string,
  repo: string,
  state: any,
  head: string,
  base: string
): Promise<string[]> {
  let pullurls: string[] = [];
  const pulls = await octo.pulls.list({
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

export async function checkIfMergedPullRequest(
  octo: Octokit,
  org: string,
  repo: string,
  pullNumber: number
): Promise<any> {
  const pullData = await octo.pulls.checkIfMerged({
    owner: org,
    repo,
    pull_number: pullNumber,
  });

  return pullData;
}

export async function getBlobContent(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string,
  filepath: string
) {
  const currentCommit = await getCurrentCommit(octo, org, repo, branch);

  const treeData = await getTree(octo, org, repo, currentCommit.treeSha);

  let content: string = "";
  const dirs: string[] = filepath.split("/");
  const filename = dirs.pop();
  let curtree = treeData;
  for (let dir of dirs) {
    let found: boolean = false;
    for (let t of curtree.tree) {
      if (t.path === dir) {
        curtree = await getTree(octo, org, repo, t.sha);
        found = true;
        break;
      }
    }
    if (!found) return "";
  }
  for (let t of curtree.tree) {
    if (t.path === filename) {
      const blobdata = (
        await octo.git.getBlob({
          owner: org,
          repo,
          file_sha: t.sha,
        })
      ).data;

      let buff = Buffer.from(blobdata.content, "base64");
      content = buff.toString("utf-8");
      // content = blobdata.content;
      break;
    }
  }

  return content;
}

export async function readCurrentCommitContent(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string,
  filepaths: string[]
) {
  const currentCommit = await getCurrentCommit(octo, org, repo, branch);

  const treeData = await getTree(octo, org, repo, currentCommit.treeSha);

  let content: string = "";
  const fs = require("fs");
  for (let t of treeData.tree) {
    if (filepaths.find((element) => element == t.path) !== undefined) {
      const blobdata = (
        await octo.git.getBlob({
          owner: org,
          repo,
          file_sha: t.sha,
        })
      ).data;

      let buff = Buffer.from(blobdata.content, "base64");
      content = buff.toString("utf-8");
      // content = blobdata.content;
      fs.writeFileSync(t.path, content);
      break;
    }
  }
}

export async function deleteFile(
  octo: Octokit,
  org: string,
  repo: string,
  branch: string,
  filepath: string
) {
  const currentCommit = await getCurrentCommit(octo, org, repo, branch);
  console.log("current commit:" + currentCommit.commitSha);
  const treeData = await getTree(octo, org, repo, currentCommit.treeSha);
  const dirs: string[] = filepath.split("/");
  const filename = dirs.pop();
  let curtree = treeData;
  for (let dir of dirs) {
    let found: boolean = false;
    for (let t of curtree.tree) {
      if (t.path === dir) {
        curtree = await getTree(octo, org, repo, t.sha);
        found = true;
        break;
      }
    }
    if (!found) return "";
  }

  for (let t of curtree.tree) {
    console.log("file path:" + t.path);
    if (t.path === filename) {
      console.log("find target:" + filepath + ", tsha:" + t.sha);
      try {
        const blobdata = (
          await octo.git.getBlob({
            owner: org,
            repo,
            file_sha: t.sha,
          })
        ).data;

        let buff = Buffer.from(blobdata.content, "base64");
        let content = buff.toString("utf-8");
        console.log(content);
        // content = blobdata.content;
        const deleteResult = await octo.repos.deleteFile({
          owner: org,
          repo,
          path: filepath,
          message: "delete file " + filepath,
          sha: t.sha,
        });
        const newCommit = deleteResult.data.commit;
        await setBranchToCommit(octo, org, repo, branch, newCommit.sha);
      } catch (e) {
        console.log("failed to delete file: " + filepath);
        console.log(e);
      }

      break;
    }
  }
}

export function NewOctoKit(token: string): Octokit {
  const octo = new Octokit({
    // auth: process.env.PERSONAL_ACESSS_TOKEN,
    auth: token,
  });

  return octo;
}
