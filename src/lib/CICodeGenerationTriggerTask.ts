import CodeGenerateHandler from "./CodeGenerateHandler";
import { CodeGenerationStatus, SDKCodeGeneration } from "./CodeGenerationModel";
import { CodeGenerationType } from "./common";
import { PipelineCredential } from "./pipeline/PipelineCredential";
import CodeGenerationTable from "./sqldb/CodeGenerationTable";
import { CodegenDBCredentials } from "./sqldb/DBCredentials";

export async function CICodeGenerationTriggerTask() {
    let codegens: SDKCodeGeneration[] = await CodeGenerationTable.ListSDKCodeGenerations(CodegenDBCredentials, {
        type: CodeGenerationType.CI,
    });
    for (let codegen of codegens) {
        /* pr is merged. complete the code generation. */
        if (codegen.status != CodeGenerationStatus.CODE_GENERATION_STATUS_IN_PROGRESS) {
            const err = CodeGenerateHandler.RunSDKCodeGeneration(PipelineCredential.token, codegen.name);
            if (err !== undefined) {
                console.log("Failed to re-run code generation " + codegen.toString());
              } else {
                console.log("Code generation " + codegen.toString() + " is triggered.");
              }
        }
      }
}