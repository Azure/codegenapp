// import {
//   InsertCodeGeneration,
//   getCodeGeneration,
//   DeleteCodeGeneration,
//   UpdateCodeGenerationValue,
//   IsValidCodeGenerationExist,
//   SubmitSDKCodeGeneration,
//   UpdateSDKCodeGenerationValues,
// } from "../../src/lib/sqldb/CodeGenerationTable";
// import { AssertionError } from "assert";
// import { readCVSSync, RepoType } from "../../src/lib/common";
// import { ENVKEY } from "../../src/lib/Model";
// import {
//   CodeGeneration,
//   SDKCodeGeneration,
// } from "../../src/lib/CodeGenerationModel";
// import { setup } from "../setup/setup";
// import { default_codegen_repo, default_terraform_repo } from "../../src/config";
// import { CodegenDBCredentials } from "../../src/lib/sqldb/DBCredentials";

// var assert = require("assert");
// describe("code generation test", () => {
//   // initService();
//   setup();
//   it("ingest an code generation", async () => {
//     jest.setTimeout(50000);
//     /*insert a code generation. */
//     let cg: CodeGeneration = new CodeGeneration("testRP", "terraform", "depth");
//     let e = await InsertCodeGeneration(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       cg
//     );
//     if (e !== undefined) {
//       console.log(e);
//     }
//     assert.equal(e, undefined);

//     /*get a code generation. */
//     let { codegen, err } = await getCodeGeneration(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       "testRP",
//       "terraform",
//       "depth"
//     );
//     assert.equal(err, undefined);
//     assert.equal(codegen.resourceProvider, "testRP");
//     assert.equal(codegen.sdk, "terraform");
//     assert.equal(codegen.type, "depth");

//     let exist: boolean = await IsValidCodeGenerationExist(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       "testRP",
//       "terraform",
//       "depth"
//     );

//     assert(exist === true);

//     /* update a code generation. */
//     const uperr = await UpdateCodeGenerationValue(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       "testRP",
//       "terraform",
//       "depth",
//       "status",
//       "customizing"
//     );
//     assert.equal(err, undefined);
//     /*check update. */
//     let { codegen: updateCodegen, err: updateerr } = await getCodeGeneration(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       "testRP",
//       "terraform",
//       "depth"
//     );
//     assert.equal(updateerr, undefined);
//     assert.equal(updateCodegen.resourceProvider, "testRP");
//     assert.equal(updateCodegen.sdk, "terraform");
//     assert.equal(updateCodegen.type, "depth");
//     assert.equal(updateCodegen.status, "customizing");

//     const delret = await DeleteCodeGeneration(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       "testRP",
//       "terraform",
//       "depth"
//     );
//     assert.equal(delret, undefined);

//     let alreadyOnboard: boolean = await IsValidCodeGenerationExist(
//       process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//       process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//       process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//       process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//       "testRP",
//       "terraform",
//       "depth"
//     );

//     assert(alreadyOnboard === false);
//   });

//   it("ingest a sdk code generation", async () => {
//     jest.setTimeout(50000);
//     /*insert a code generation. */
//     let cg: SDKCodeGeneration = new SDKCodeGeneration(
//       "sdkcodegen1",
//       "testRP",
//       "resource-manage",
//       "ALL",
//       "package-2020-01",
//       "terraform",
//       {
//         type: RepoType.GITHUB,
//         path: "https://github.com/Azure/azure-rest-api-specs",
//         branch: "master",
//       },
//       default_terraform_repo,
//       default_codegen_repo,
//       "codegenteam",
//       "dev"
//     );
//     let e = await SubmitSDKCodeGeneration(CodegenDBCredentials, cg);
//     if (e !== undefined) {
//       console.log(e);
//     }
//     assert.equal(e, undefined);
//     await UpdateSDKCodeGenerationValues(CodegenDBCredentials, cg.name, {
//       status: "completed",
//       lastPipelineBuildID: "40087",
//     });

//     // /*get a code generation. */
//     // let { codegen, err } = await getCodeGeneration(
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//     //   "testRP",
//     //   "terraform",
//     //   "depth"
//     // );
//     // assert.equal(err, undefined);
//     // assert.equal(codegen.resourceProvider, "testRP");
//     // assert.equal(codegen.sdk, "terraform");
//     // assert.equal(codegen.type, "depth");

//     // let exist: boolean = await IsValidCodeGenerationExist(
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//     //   "testRP",
//     //   "terraform",
//     //   "depth"
//     // );

//     // assert(exist === true);

//     // /* update a code generation. */
//     // const uperr = await UpdateCodeGenerationValue(
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//     //   "testRP",
//     //   "terraform",
//     //   "depth",
//     //   "status",
//     //   "customizing"
//     // );
//     // assert.equal(err, undefined);
//     // /*check update. */
//     // let { codegen: updateCodegen, err: updateerr } = await getCodeGeneration(
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//     //   "testRP",
//     //   "terraform",
//     //   "depth"
//     // );
//     // assert.equal(updateerr, undefined);
//     // assert.equal(updateCodegen.resourceProvider, "testRP");
//     // assert.equal(updateCodegen.sdk, "terraform");
//     // assert.equal(updateCodegen.type, "depth");
//     // assert.equal(updateCodegen.status, "customizing");

//     // const delret = await DeleteCodeGeneration(
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//     //   "testRP",
//     //   "terraform",
//     //   "depth"
//     // );
//     // assert.equal(delret, undefined);

//     // let alreadyOnboard: boolean = await IsValidCodeGenerationExist(
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DATABASE],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_USER],
//     //   process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
//     //   "testRP",
//     //   "terraform",
//     //   "depth"
//     // );

//     // assert(alreadyOnboard === false);
//   });
// });
