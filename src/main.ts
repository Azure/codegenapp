import { readCVS, CodeGeneration } from "./common";
import { ReadFileFromRepo, ReadFileFromPR, DeleteFilesFromRepo } from "./codegen";
import { IngestCandidates } from "./CandidateService";
import { readFile } from "fs";
import { readRepoFile } from "./devopsutil/devopsutil";
import { InsertCodeGeneration, getCodeGeneration } from "./lib/CodeGeneration";

// readCVS(__dirname+'/TFCandidate.csv');
// async function main() {
//     try {
//         await ReadFileFromRepo("110b90e141d843a74386b3194551b45d694f0f5f", "devdiv", "codegen-pipeline", "main", "config/TFCandidate.csv");
//     }catch(e) {
//         console.log(e);
//     }
// }

// main();
//IngestCandidates(__dirname+'/TFCandidate.csv', "vscinsight.database.windows.net", "VSCBIExternalSource", "vscbibackend", "#Bugsfor$backend", "AMEClientTools_Coverage_TFCandidateResources");

//ReadFileFromPR("110b90e141d843a74386b3194551b45d694f0f5f", "Azure", "depth-coverage-pipeline", 681, "schema.json");

//DeleteFilesFromRepo("110b90e141d843a74386b3194551b45d694f0f5f", "Azure", "depth-coverage-pipeline", "config", ["ToGenerate.json"]);
// readRepoFile("config/CLICandidate.csv", "https://dev.azure.com/devdiv", "DevDiv", "codegen-pipeline", "main");
// let codegen: CodeGeneration = new CodeGeneration("testRP", "terraform", "depth");
// InsertCodeGeneration("codegen-db-server.database.windows.net", "codegenonboarding", "codegenauto", "cgbackendtrack@123iop", codegen);
async function main() {
    try {
        // await ReadFileFromRepo("110b90e141d843a74386b3194551b45d694f0f5f", "devdiv", "codegen-pipeline", "main", "config/TFCandidate.csv");
        const {codegen, err} = await getCodeGeneration("codegen-db-server.database.windows.net", "codegenonboarding", "codegenauto", "cgbackendtrack@123iop", "testRP", "terraform", "depth");
        console.log(codegen.resourceProvider);
    }catch(e) {
        console.log(e);
    }
}

main()
