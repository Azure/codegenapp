import * as yaml from "node-yaml";
/**
 * pipeline meta-data varaibles build in compile.
 */
 export interface PipelineVariablesInterface {
  variables: {
      SDK: string;
    }
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