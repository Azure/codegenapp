import { CodegenDBCredentials } from "./DBCredentials";
import { ListCodeGenerationsByStatus } from "./CodeGeneration";
import { CodeGeneration, CodeGenerationStatus } from "./CodeGenerationModel";
import { PipelineCredential } from "./pipeline/PipelineCredential";
import { GetPullRequest, IsMergedPullRequest } from "./CodeRepoGit";
import CodeGenerateHandler from "./CodeGenerateHandler";
import { ORG, SDK } from "./common";

export async function CompleteCodeGenerationTask() {
  /* Get all code generations which under pipeline completed status. */
  let codegens: CodeGeneration[] = await ListCodeGenerationsByStatus(
    CodegenDBCredentials.server,
    CodegenDBCredentials.db,
    CodegenDBCredentials.user,
    CodegenDBCredentials.pw,
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
    let codegenorg: string = ORG.AZURE;
    let sdkorg: string = ORG.AZURE;
    if (codegen.sdk.toLowerCase() === SDK.TF_SDK) {
      sdkorg = ORG.MS;
    }
    let swaggerorg: string = ORG.AZURE;

    const err = CodeGenerateHandler.CompleteCodeGeneration(
      PipelineCredential.token,
      codegen.resourceProvider,
      codegen.sdk,
      codegen.type,
      codegenorg,
      sdkorg,
      swaggerorg
    );
    if (err !== undefined) {
      console.log("Failed to complete code generation " + codegen.toString());
    } else {
      console.log("Code generation " + codegen.toString() + " is completed.");
    }
  }
}
