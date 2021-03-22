import { readCVS } from "./common";
import { ReadFileFromRepo, ReadFileFromPR, DeleteFilesFromRepo } from "./codegen";
import { IngestCandidates } from "./CandidateService";

readCVS(__dirname+'/TFCandidate.csv');
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

DeleteFilesFromRepo("110b90e141d843a74386b3194551b45d694f0f5f", "Azure", "depth-coverage-pipeline", "config", ["ToGenerate.json"]);