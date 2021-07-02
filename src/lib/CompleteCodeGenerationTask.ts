import { CodegenDBCredentials } from "./sqldb/DBCredentials";
import CodeGenerationTable from "./sqldb/CodeGenerationTable";
import {
  CodeGeneration,
  CodeGenerationStatus,
  SDKCodeGeneration,
} from "./CodeGenerationModel";
import { PipelineCredential } from "./pipeline/PipelineCredential";
import { GetPullRequest, IsMergedPullRequest } from "./CodeRepoGit";
import CodeGenerateHandler from "./CodeGenerateHandler";
import { ORG, SDK } from "./common";

export async function CompleteCodeGenerationTask() {
  /* Get all code generations which under pipeline completed status. */
  let codegens: SDKCodeGeneration[] = await CodeGenerationTable.ListSDKCodeGenerationsByStatus(
    CodegenDBCredentials,
    CodeGenerationStatus.CODE_GENERATION_STATUS_PIPELINE_COMPLETED
  );
  for (let codegen of codegens) {
    const codepr = codegen.codePR;
    // const prdata = await GetPullRequest(PipelineCredential.token, codepr);
    if (codepr !== undefined && codepr.length > 0) {
      const isMerged: boolean = await IsMergedPullRequest(
        PipelineCredential.token,
        codepr
      );
      if (!isMerged) continue;
    }

    const swaggerpr = codegen.swaggerPR;
    if (swaggerpr !== undefined && swaggerpr.length > 0) {
      const isMerged: boolean = await IsMergedPullRequest(
        PipelineCredential.token,
        swaggerpr
      );
      if (!isMerged) continue;
    }

    /* pr is merged. complete the code generation. */

    const err = CodeGenerateHandler.CompleteSDKCodeGeneration(
      PipelineCredential.token,
      codegen.name
    );
    if (err !== undefined) {
      console.log("Failed to complete code generation " + codegen.toString());
    } else {
      console.log("Code generation " + codegen.toString() + " is completed.");
    }
  }
}
