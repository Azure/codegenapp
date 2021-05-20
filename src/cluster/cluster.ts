import "reflect-metadata";
import codegenApp from "../app/codegenApp";

const cluster = require("cluster");
let numCPUs = require("os").cpus.length;

if (cluster.isMaster) {
  // codegenApp.start();
  console.log("numCPUs:" + numCPUs);
  numCPUs = 1;
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    console.log("start worker");
    cluster.fork();
  }
} else {
  // const service = createService();
  codegenApp.start();
  console.log(`Worker ${process.pid} started`);
}
