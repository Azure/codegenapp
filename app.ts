#!/usr/bin/env node

import { TriggerOnboard, DeletePipelineBranch, DeleteAllDepthBranchs, submit, uploadToRepo} from "depthcoverage/dist/Onboard"
import { ORG, SDK, REPO } from "./common";
import { Customize, Onboard } from "./codegen";

var express = require('express');
const app = express();
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

app.get('/', function(req, res) {
    res.send("hello world");
});
app.listen(port);

app.get('/PullRequest', function(req, res) {
    res.send("<html><a href=\"https://github.com/Azure/depth-coverage-pipeline/pull/21\">pull request</a><html>")
});

app.use(
    express.urlencoded({
      extended: true
    })
  );
  
app.use(express.json());
app.put('/DepthCoverage/Trigger', function(req, res){
    console.log(req.body);
    console.log(req.body.pipelinepr)
    res.send('put method');
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
  if (
      !dbserver ||
      !db ||
      !dbuser ||
      !dbpw 
  ) {
      throw new Error("Missing required parameter");
  }
  console.log(token + "," + org + "," + repo);
  await TriggerOnboard(dbserver, db, dbuser, dbpw, token, org, repo, "main", candidate);
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
  await DeleteAllDepthBranchs(token, org, repo);
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
    const prlink = await submit(token, org, repo, title, branch, basebranch);
    res.send(prlink);
  }catch(e) {
    console.log(e);
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
  console.log(req.params.rpname);
  console.log(req.params.sdk);
  // console.log(req.parameter.token);
  const org = ORG.AZURE;
  // const repo = req.body.repo;
  // const branch = req.body.branch;
  const token = req.query.token;
  const rp = req.params.rpname;
  const sdk = req.params.sdk;
  const triggerPR = req.query.triggerPR;
  const codePR = req.query.codePR;
  await Customize(token, rp, sdk, triggerPR, codePR);
  res.send('customize');
});

app.get('/DepthCoverage/RPs/:rpname/SDKs/:sdk/submit', async function(req, res) {
  console.log(req.params.rpname);
  console.log(req.params.sdk);
  // console.log(req.parameter.token);
  const org = ORG.AZURE;
  // const repo = req.body.repo;
  // const branch = req.body.branch;
  const token = req.query.token;
  const rp = req.params.rpname;
  const sdk = req.params.sdk;
  await Onboard(rp, sdk, token);

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
  let sdkorg = ORG.AZURE;
  if (sdk.toLowerCase() === SDK.TF_SDK) {
    sdkorg = ORG.MS;
  }
  const branch = "Depth-" + sdk.toLowerCase() + "-" + rp;
  /* delete depth-coverage rp branch */
  await DeletePipelineBranch(token, org, REPO.DEPTH_COVERAGE_REPO, branch);

  /* delete sdk rp branch. */
  let sdkrepo = "";
  if (sdk === SDK.TF_SDK) {
    sdkrepo = REPO.SWAGGER_REPO;
  } else if (sdk === SDK.CLI_CORE_SDK) {
    sdkrepo = REPO.CLI_REPO;
  }
  await DeletePipelineBranch(token, sdkorg, sdkrepo, branch);

  /*delete swagger rp branch */
  await DeletePipelineBranch(token, org, REPO.SWAGGER_REPO, branch);
      res.send('delete branch' + branch);
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