#!/usr/bin/env node

import { TriggerOnboard, DeletePipelineBranch, DeleteAllDepthBranchs} from "depthcoverage/dist/Onboard"

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

app.get('/DepthCoverage/submitCode', function(req, res) {
  console.log(req.query.triggerPR);
  console.log(req.query.codePR);

  res.send('submit code method');
});

app.get('/DepthCoverage/Customize', function(req, res) {
  console.log(req.query.triggerPR);
  res.send('trigger method');
});

app.post('/DepthCoverage/Customize', function(req, res) {
  console.log(req.query.triggerPR);
  res.send('trigger method');
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