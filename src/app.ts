#!/usr/bin/env node

import { TriggerOnboard, DeletePipelineBranch, DeleteAllDepthBranchs, submit} from "./depthcoverage/Onboard"
import { ORG, SDK, REPO, README, OnboardType } from "./common";
import { Customize, Onboard, listOpenPullRequest, TriggerRPOnboard, ConfigureOnboard } from "./codegen";
import { IngestCandidates, addCandidate } from "./CandidateService";
import { NewOctoKit, uploadToRepo } from "./gitutil/GitAPI";
import { CandidateResource } from "./depthcoverage/QueryDepthCoverageReport";

var express = require('express');
const app = express();
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

app.get('/', function(req, res) {
    res.send("hello world");
});
app.listen(port);
let customizeTime = (new Date().getTime()) / 1000;
app.get('/PullRequest', function(req, res) {
    res.send("<html><a href=\"https://github.com/Azure/depth-coverage-pipeline/pull/21\">pull request</a><html>")
});

app.use(
    express.urlencoded({
      extended: true
    })
  );
  
app.use(express.json());

app.post('/DepthCoverage/sdks/:sdk/candidates', function(req, res) {
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  const dbserver=req.body.DBServer;
  const db=req.body.Database;
  const dbuser = req.body.DBUsername;
  const dbpw = req.body.DBPassword;
  const sdk = req.params.sdk;
  if (
    !dbserver ||
    !db ||
    !dbuser ||
    !dbpw 
  ) {
      throw new Error("Missing required parameter");
  }
  let candidates = req.body.candidates;
  //let table = req.body.table;
  IngestCandidates(candidates, dbserver, db, dbuser, dbpw, sdk);
  res.send("ingest candidate");
});

app.post('/DepthCoverage/sdks/:sdk/candidate/RPs/:rpname/resource/:rsname', function(req, res) {
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  const dbserver=req.body.DBServer;
  const db=req.body.Database;
  const dbuser = req.body.DBUsername;
  const dbpw = req.body.DBPassword;
  const sdk = req.params.sdk;
  const rp = req.params.rpname;
  const rs = req.params.rsname;
  const apiversion = req.body.apiversion;
  const tag = req.body.tag;
  const start = req.body.start;
  const end = req.body.end;

  let candidate: CandidateResource = new CandidateResource(rp, rs, apiversion, tag, start, end);

  addCandidate(candidate, dbserver, db, dbuser, dbpw, sdk);

  res.send("ingest candidate(" + rp + "," + rs + ")");

});

app.post('/DepthCoverage/Trigger', async function(req, res){
  console.log(req.body);
  console.log(req.body.pipelinepr)
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  const dbserver=req.body.DBServer;
  const db=req.body.Database;
  const dbuser = req.body.DBUsername;
  const dbpw = req.body.DBPassword;
  const candidate = req.body.candidateResources;
  const platform = req.body.platform;
  let branch = "main";
  if (platform !== undefined && platform.toLowerCase() === "dev") branch = "dev";
  if (
      !dbserver ||
      !db ||
      !dbuser ||
      !dbpw 
  ) {
      throw new Error("Missing required parameter");
  }
  console.log(token + "," + org + "," + repo);
  await TriggerOnboard(dbserver, db, dbuser, dbpw, token, org, repo, branch, candidate);
  res.send('post method');
});

app.post('/DepthCoverage/onboard/complete',  async function(req, res){
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  const branch = req.body.branch;
  await DeletePipelineBranch(token, org, repo, branch);
  res.send('delete branch' + branch);
});

app.post('/DepthCoverage/cancel',  async function(req, res){
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  /* delete depth coverage branch. */
  try {
    await DeleteAllDepthBranchs(token, org, repo);
  } catch (e) {
    console.log("Failed to delete branches from depthcoverage.")
    console.log(e);
  }

  /* delete sdk branches. */
  
  res.send('delete depth branches');
});

app.post('/DepthCoverage/generateCodePR',  async function(req, res){
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  const title = req.body.title;
  const branch = req.body.branch;
  const basebranch = req.body.base;
  console.log("token:"+token+",org:" + org + ",repo:" + repo + ",title:" + title + ",branch:" + branch + ",base:" + basebranch);
  try {
    const pulls: string[] = await listOpenPullRequest(token, org, repo, branch, basebranch);
    if (pulls.length > 0) {
      res.send(pulls[0]);
    } else {
      const {prlink, err} = await submit(token, org, repo, title, branch, basebranch);
      if (err !== undefined) {
        res.statusCode = 400;
        res.send("error");
      } else {
        res.send(prlink);
      }
    }
  }catch(e) {
    console.log(e);
    res.statusCode = 400;
    res.send("error");
  }
  
});

app.get('/DepthCoverage/submitCode', async function(req, res) {
  const token = req.body.token;
  const org = req.body.org;
  const repo = req.body.repo;
  const title = req.body.title;
  const branch = req.body.branch;
  const basebranch = req.body.base;
  const prlink = await submit(token, org, repo, title, branch, basebranch);
  res.send(prlink);
});

app.get('/DepthCoverage/Customize', function(req, res) {
  console.log(req.query.triggerPR);
  res.send('trigger method');
});

app.post('/DepthCoverage/Customize', function(req, res) {
  console.log(req.query.triggerPR);
  res.send('trigger method');
});

app.get('/DepthCoverage/RPs/:rpname/SDKs/:sdk/Customize', async function(req, res) {
  let currentSecond = (new Date().getTime()) / 1000;
  if (currentSecond - customizeTime < 30) {
    res.send("A customize was triggered. \n pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=14196");
    return;
  }
  customizeTime = currentSecond;
  console.log(req.params.rpname);
  console.log(req.params.sdk);
  // console.log(req.parameter.token);
  const org = req.query.org;
  // const repo = req.body.repo;
  // const branch = req.body.branch;
  const token = req.query.token;
  const rp = req.params.rpname;
  const sdk = req.params.sdk;
  const triggerPR = req.query.triggerPR;
  const codePR = req.query.codePR;
  let excludeTest :boolean = false;
  if (req.query.excludeTest !== undefined) {
    excludeTest = req.query.excludeTest;
  }
  await Customize(token, rp, sdk, triggerPR, codePR, org, excludeTest);
  res.send('customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=14196');

});

app.get('/DepthCoverage/RPs/:rpname/SDKs/:sdk/submit', async function(req, res) {
  console.log(req.params.rpname);
  console.log(req.params.sdk);
  // console.log(req.parameter.token);
  // const repo = req.body.repo;
  // const branch = req.body.branch;
  const token = req.query.token;
  const swaggerorg = req.query.swaggerorg;
  const org = req.query.org;
  const rp = req.params.rpname;
  const sdk = req.params.sdk;

  await Onboard(rp, sdk, token, swaggerorg, org);
  // if (org !== undefined) {
  //   await Onboard(rp, sdk, token, org);
  // }
  // else {
  //   await Onboard(rp, sdk, token);
  // }

  /*delete temple code repo. */

  res.send('submit');
});

app.post('/DepthCoverage/RPs/:rpname/SDKs/:sdk/onboard/complete', async function (req, res) {
  const token = req.body.token;
  // const org = req.body.org;
  const org = ORG.AZURE;
  // const repo = req.body.repo;
  // const branch = req.body.branch;
  const rp = req.params.rpname;
  const sdk:string = req.params.sdk;
  let sdkorg:string = req.body.org;
  const swaggerorg: string = req.body.swaggerorg;
  if (sdkorg === undefined) {
    sdkorg = ORG.AZURE;
    if (sdk.toLowerCase() === SDK.TF_SDK) {
      sdkorg = ORG.MS;
    }
  }
  const branch = "depth-" + sdk.toLowerCase() + "-" + rp;
  /* delete depth-coverage rp branch */
  try {
    await DeletePipelineBranch(token, org, REPO.DEPTH_COVERAGE_REPO, branch);
  } catch(e) {
    console.log("Failed to delete depthcoverage branch: " + branch);
    console.log(e);
  }
  

  /* delete sdk rp branch. */
  let sdkrepo = "";
  if (sdk === SDK.TF_SDK) {
    sdkrepo = REPO.TF_PROVIDER_REPO;
  } else if (sdk === SDK.CLI_CORE_SDK) {
    sdkrepo = REPO.CLI_REPO;
  }
  try {
    await DeletePipelineBranch(token, sdkorg, sdkrepo, branch);
    let codebranch = "depth-code-" + sdk.toLowerCase() + "-" + rp;
    await DeletePipelineBranch(token, sdkorg, sdkrepo, codebranch);
  } catch(e) {
    console.log("Failed to delete sdk branch: " + branch);
    console.log(e);
  }

  /*delete swagger rp branch */
  try {
    await DeletePipelineBranch(token, swaggerorg != undefined ? swaggerorg: org, REPO.SWAGGER_REPO, branch);
  } catch(e) {
    console.log("Failed to delete swagger branch: " + branch);
    console.log(e);
  }

  res.send(rp + " " + sdk + ' onboarding is completed.');
});

app.post('/onboard/RPs/:rpname/SDKs/:sdk', async function(req, res) {
  const token = req.body.token;
  const rp = req.params.rpname;
  const sdk:string = req.params.sdk;
  const org = ORG.AZURE;
  const platform = req.body.platform;
  let branch = "main";
  if (platform !== undefined && platform.toLowerCase() === "dev") branch = "dev";
  await TriggerRPOnboard(rp, sdk, token, org, REPO.DEPTH_COVERAGE_REPO, branch, OnboardType.ADHOC_ONBOARD);

  res.send("Trigger onboard " + rp + ", sdk:" + sdk);
});

/* update the configuration of the pipeline. */
app.patch('/onboard/PRs/:rpname/SDKs/:sdk', async function(req, res) {
  const token = req.body.token;
  const rp = req.params.rpname;
  const sdk:string = req.params.sdk;
  const org = ORG.AZURE;
  const ignore = req.body.ignore;
  const excludeStages = req.body.excludeStages;
  const tag = req.body.tag;

  await ConfigureOnboard(token, rp, sdk, tag, ignore, excludeStages, OnboardType.ADHOC_ONBOARD);

  res.send("Update onboard " + rp + ", sdk:" + sdk);

});

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}