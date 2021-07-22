import * as yaml from "node-yaml";
import { RepoInfo } from "../lib/CodeGenerationModel";
/**
 * pipeline meta-data varaibles build in compile.
 */
export interface PipelineVariablesInterface {
  variables: {
    CodeGenerationName: string;
    SDK: string;
    stages: string;
    SPEC_REPO_TYPE: string;
    SPEC_REPO_URL: string;
    SPEC_REPO_BASE_BRANCH: string;
    SPEC_REPO_NAME: string;
    SPEC_REPO_OWNER: string;
    SDK_REPO_TYPE: string;
    SDK_REPO_URL: string;
    SDK_REPO_BASE_BRANCH: string;
    SDK_REPO_NAME: string;
    SDK_REPO_OWNER: string;
    // SwaggerRepo: RepoInfo;
    // SdkRepo: RepoInfo;
    // stages: string[];
  };
}

// export function main() {
//     const v: PipelineVariablesInterface = {
//         Variables: {
//             SDK: "hello"
//         }
//     }

//     const fs = require("fs");
//     fs.writeFileSync("Variables.yml", yaml.dump(v));
// }

// main();
