import { CodegenStatusTable, sdkCodegenTable } from "../ResourceCandiateModel";
import { CodeGenerationType, SDK, SQLStr } from "../common";
import {
  CodeGeneration,
  CodeGenerationStatus,
  RepoInfo,
  SDKCodeGeneration,
} from "../CodeGenerationModel";
import { DBCredential } from "./DBCredentials";
export class CodeGenerationTable {
  public constructor() {}
  /******************** SDK Code Generation ********************/
  /*Get code generation detail information. */
  public async GetCodeGenerationDetail(
    codegen: string
  ): Promise<CodeGeneration> {
    return undefined;
  }

  public async SubmitSDKCodeGeneration(
    credential: DBCredential,
    codegen: SDKCodeGeneration
  ): Promise<any> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_INSERT_SDKCODEGENERATION,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("name", sql.VarChar, codegen.name);
      request.input("resourceProvider", sql.VarChar, codegen.resourceProvider);
      request.input("serviceType", sql.VarChar, codegen.serviceType);
      request.input(
        "resourcesToGenerate",
        sql.VarChar,
        codegen.resourcesToGenerate
      );
      request.input("tag", sql.VarChar, codegen.tag);
      request.input("sdk", sql.VarChar, codegen.sdk);
      request.input(
        "swaggerRepo",
        sql.VarChar,
        JSON.stringify(codegen.swaggerRepo)
      );
      request.input("sdkRepo", sql.VarChar, JSON.stringify(codegen.sdkRepo));
      request.input(
        "codegenRepo",
        sql.VarChar,
        JSON.stringify(codegen.codegenRepo)
      );
      request.input("owner", sql.VarChar, codegen.owner);
      request.input("type", sql.VarChar, codegen.type);
      request.input(
        "lastPipelineBuildID",
        sql.VarChar,
        codegen.lastPipelineBuildID
      );
      request.input("status", sql.VarChar, codegen.status);

      // let result = await request.query(querystr, (err, result) => {
      //     if (err != undefined) {
      //         console.log(err);
      //         return err;
      //     }
      // });
      let { result, err } = await request.query(querystr);
      if (err != undefined) {
        console.log(err);
        if (conn !== undefined) await conn.close();
        await sql.close();
        return err;
      }
    } catch (e) {
      console.log(e);
      if (conn !== undefined) await conn.close();
      await sql.close();
      return e;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();

    return undefined;
  }

  public async getSDKCodeGeneration(
    credential: DBCredential,
    resourceProvider: string,
    sdk: string,
    type: string
  ): Promise<{ codegen: SDKCodeGeneration; err: any }> {
    // let codegens: CodeGeneration[] = [];
    let codegen: SDKCodeGeneration = undefined;
    let error: any = undefined;
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_SELECT_SDKCODEGENERATION,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("resourceProvider", sql.VarChar, resourceProvider);
      request.input("sdk", sql.VarChar, sdk);
      request.input("type", sql.VarChar, type);

      let result = await request.query(querystr);
      for (let record of result.recordset) {
        codegen = new SDKCodeGeneration(
          record["name"],
          record["resourceProvider"],
          record["serviceType"],
          record["resourcesToGenerate"],
          record["tag"],
          record["sdk"],
          record["swaggerRepo"] as RepoInfo,
          record["owner"],
          record["type"],
          record["swaggerPR"],
          record["codePR"],
          record["lastPipelineBuildID"],
          record["status"]
        );
        //codegens.push(cg);
        break;
      }

      // let result = await request.query(querystr, (err, result) => {
      //     if (err != undefined) {
      //         console.log(err);
      //         error = err;
      //     } else {
      //         for (let record of result.recordset) {
      //             codegen = new CodeGeneration(record["resourceProvider"],
      //                                                         record["sdk"],
      //                                                         record["type"],
      //                                                         record["resourcesToGenerate"],
      //                                                         record["tag"],
      //                                                         record["swaggerPR"],
      //                                                         record["codePR"],
      //                                                         record["ignoreFailure"],
      //                                                         record["excludeStages"],
      //                                                         record["pipelineBuildID"],
      //                                                         record["status"]);
      //             //codegens.push(cg);
      //             break;
      //         }
      //     }
      // });
    } catch (e) {
      console.log(e);
      error = e;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();

    return {
      codegen: codegen,
      err: undefined,
    };
    // return codegen;
  }

  public async getSDKCodeGenerationByName(
    credential: DBCredential,
    name: string
  ): Promise<{ codegen: SDKCodeGeneration; err: any }> {
    // let codegens: CodeGeneration[] = [];
    let codegen: SDKCodeGeneration = undefined;
    let error: any = undefined;
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_SELECT_SDKCODEGENERATION_By_Name,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("name", sql.VarChar, name);

      let result = await request.query(querystr);
      for (let record of result.recordset) {
        codegen = new SDKCodeGeneration(
          record["name"],
          record["resourceProvider"],
          record["serviceType"],
          record["resourcesToGenerate"],
          record["tag"],
          record["sdk"],
          JSON.parse(record["swaggerRepo"]) as RepoInfo,
          JSON.parse(record["sdkRepo"]) as RepoInfo,
          JSON.parse(record["codegenRepo"]) as RepoInfo,
          record["owner"],
          record["type"],
          record["swaggerPR"],
          record["codePR"],
          record["lastPipelineBuildID"],
          record["status"]
        );
        //codegens.push(cg);
        break;
      }
    } catch (e) {
      console.log(e);
      error = e;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();

    return {
      codegen: codegen,
      err: undefined,
    };
    // return codegen;
  }

  /* update code-gen information. */
  public async UpdateSDKCodeGenerationValue(
    credential: DBCredential,
    name: string,
    key: string,
    value: string
  ): Promise<any> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_UPDATE_SDKCODEGENERATION_VALUE,
        table,
        key,
        key
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("name", sql.VarChar, name);
      request.input(key, sql.VarChar, value);

      let { result, err } = await request.query(querystr);
      if (err != undefined) {
        console.log(err);
        return err;
      }
    } catch (e) {
      console.log(e);
      if (conn !== undefined) await conn.close();
      await sql.close();
      return e;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();
    return undefined;
  }

  /* update code-gen information. */
  public async UpdateSDKCodeGenerationValues(
    credential: DBCredential,
    name: string,
    values: {}
  ): Promise<any> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);
      let keys = Object.keys(values);
      let sql_value_set_parameters: string[] = [];
      for (const key of keys) {
        sql_value_set_parameters.push(key + "=@" + key);
      }
      console.log("sql statememnt: " + sql_value_set_parameters.join(","));
      let querystr = require("util").format(
        SQLStr.SQLSTR_UPDATE_SDKCODEGENERATION_VALUES,
        table,
        sql_value_set_parameters.join(",")
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("name", sql.VarChar, name);
      // request.input(key, sql.VarChar, value);
      for (const key of keys) {
        request.input(key, sql.VarChar, values[key]);
      }

      let { result, err } = await request.query(querystr);
      if (err != undefined) {
        console.log(err);
        return err;
      }
    } catch (e) {
      console.log(e);
      if (conn !== undefined) await conn.close();
      await sql.close();
      return e;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();
    return undefined;
  }

  public async DeleteSDKCodeGeneration(
    credential: DBCredential,
    name: string
  ): Promise<any> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_DELETE_SDKCODEGENERATION,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("name", sql.VarChar, name);

      let { result, err } = await request.query(querystr);
      if (err != undefined) {
        console.log(err);
        return err;
      }
    } catch (e) {
      console.log(e);
      if (conn !== undefined) await conn.close();
      await sql.close();
      return e;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();
    return undefined;
  }

  /* check if there is any valid code generation exists. */
  public async ExistValidSDKCodeGeneration(
    credential: DBCredential,
    name: string,
    type: string
  ): Promise<boolean> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = CodegenStatusTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_SELECT_SDKCODEGENERATION_By_Name,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("name", sql.VarChar, name);

      let result = await request.query(querystr);

      if (result.recordset === undefined && result.recordset.length <= 0)
        return false;
      for (let record of result.recordset) {
        const codegen = new SDKCodeGeneration(
          record["name"],
          record["resourceProvider"],
          record["serviceType"],
          record["resourcesToGenerate"],
          record["tag"],
          record["sdk"],
          JSON.parse(record["swaggerRepo"]) as RepoInfo,
          JSON.parse(record["sdkRepo"]) as RepoInfo,
          JSON.parse(record["codegenRepo"]) as RepoInfo,
          record["owner"],
          record["type"],
          record["swaggerPR"],
          record["codePR"],
          record["lastPipelineBuildID"],
          record["status"]
        );
        if (
          codegen.status !==
            CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
          codegen.status !==
            CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
        ) {
          if (conn !== undefined) await conn.close();
          return true;
        }
      }
    } catch (e) {
      console.log(e);
      if (conn !== undefined) await conn.close();
      await sql.close();
      return false;
    }

    if (conn !== undefined) await conn.close();
    await sql.close();
    return false;
  }

  /*Get all code generations of an special onboard type. */
  public async ListSDKCodeGenerations(
    credential: DBCredential,
    type: string,
    filterCompleted: boolean = false
  ): Promise<SDKCodeGeneration[]> {
    let codegens: SDKCodeGeneration[] = [];
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_LIST_SDKCODEGENERATION,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("type", sql.VarChar, type);

      let result = await request.query(querystr);

      if (result.recordset === undefined || result.recordset.length === 0)
        return codegens;
      for (let record of result.recordset) {
        if (filterCompleted) {
          if (
            record["status"] ===
              CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
            record["status"] ===
              CodeGenerationStatus.CODE_GENERATION_STATUS_PIPELINE_COMPLETED
          )
            continue;
        }
        const codegen = new SDKCodeGeneration(
          record["name"],
          record["resourceProvider"],
          record["serviceType"],
          record["resourcesToGenerate"],
          record["tag"],
          record["sdk"],
          record["swaggerRepo"] as RepoInfo,
          record["sdkRepo"] as RepoInfo,
          record["codegenRepo"] as RepoInfo,
          record["owner"],
          record["type"],
          record["swaggerPR"],
          record["codePR"],
          record["lastPipelineBuildID"],
          record["status"]
        );
        codegens.push(codegen);
      }
    } catch (e) {
      console.log(e);
    }

    if (conn !== undefined) await conn.close();
    await sql.close();
    return codegens;
  }

  /*Get all code generations of an special status. */
  public async ListSDKCodeGenerationsByStatus(
    credential: DBCredential,
    status: string
  ): Promise<SDKCodeGeneration[]> {
    let codegens: SDKCodeGeneration[] = [];
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = sdkCodegenTable;

    let conn = undefined;
    try {
      conn = await sql.connect(config);

      let querystr = require("util").format(
        SQLStr.SQLSTR_LIST_SDKCODEGENERATION,
        table
      );

      const request = conn.request();
      // request.input("table", sql.VarChar, table);
      request.input("status", sql.VarChar, status);

      let result = await request.query(querystr);

      if (result.recordset === undefined || result.recordset.length === 0)
        return codegens;
      for (let record of result.recordset) {
        const codegen = new SDKCodeGeneration(
          record["name"],
          record["resourceProvider"],
          record["serviceType"],
          record["resourcesToGenerate"],
          record["tag"],
          record["sdk"],
          record["swaggerRepo"] as RepoInfo,
          record["sdkRepo"] as RepoInfo,
          record["codegenRepo"] as RepoInfo,
          record["owner"],
          record["type"],
          record["swaggerPR"],
          record["codePR"],
          record["lastPipelineBuildID"],
          record["status"]
        );
        codegens.push(codegen);
      }
    } catch (e) {
      console.log(e);
    }

    if (conn !== undefined) await conn.close();
    await sql.close();
    return codegens;
  }
}
export default new CodeGenerationTable();

// export async function InsertCodeGeneration(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   codegen: CodeGeneration
// ): Promise<any> {
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_INSERT_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, codegen.resourceProvider);
//     request.input(
//       "resourcesToGenerate",
//       sql.VarChar,
//       codegen.resourcesToGenerate
//     );
//     request.input("tag", sql.VarChar, codegen.tag);
//     request.input("swaggerPR", sql.VarChar, codegen.swaggerPR);
//     request.input("codePR", sql.VarChar, codegen.codePR);
//     request.input("sdk", sql.VarChar, codegen.sdk);
//     request.input("type", sql.VarChar, codegen.type);
//     request.input("ignoreFailure", sql.VarChar, codegen.ignoreFailure);
//     request.input("excludeStages", sql.VarChar, codegen.excludeStages);
//     request.input("pipelineBuildID", sql.VarChar, codegen.pipelineBuildID);
//     request.input("status", sql.VarChar, codegen.status);

//     // let result = await request.query(querystr, (err, result) => {
//     //     if (err != undefined) {
//     //         console.log(err);
//     //         return err;
//     //     }
//     // });
//     let { result, err } = await request.query(querystr);
//     if (err != undefined) {
//       console.log(err);
//       if (conn !== undefined) await conn.close();
//       await sql.close();
//       return err;
//     }
//   } catch (e) {
//     console.log(e);
//     if (conn !== undefined) await conn.close();
//     await sql.close();
//     return e;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();

//   return undefined;
// }

// /* get resource provider code-gen information. */
// export async function getCodeGeneration(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   resourceProvider: string,
//   sdk: string,
//   type: string
// ): Promise<{ codegen: CodeGeneration; err: any }> {
//   // let codegens: CodeGeneration[] = [];
//   let codegen: CodeGeneration = undefined;
//   let error: any = undefined;
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_SELECT_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, resourceProvider);
//     request.input("sdk", sql.VarChar, sdk);
//     request.input("type", sql.VarChar, type);

//     let result = await request.query(querystr);
//     for (let record of result.recordset) {
//       codegen = new CodeGeneration(
//         record["resourceProvider"],
//         record["sdk"],
//         record["type"],
//         record["resourcesToGenerate"],
//         record["tag"],
//         record["swaggerPR"],
//         record["codePR"],
//         record["ignoreFailure"],
//         record["excludeStages"],
//         record["pipelineBuildID"],
//         record["status"]
//       );
//       //codegens.push(cg);
//       break;
//     }

//     // let result = await request.query(querystr, (err, result) => {
//     //     if (err != undefined) {
//     //         console.log(err);
//     //         error = err;
//     //     } else {
//     //         for (let record of result.recordset) {
//     //             codegen = new CodeGeneration(record["resourceProvider"],
//     //                                                         record["sdk"],
//     //                                                         record["type"],
//     //                                                         record["resourcesToGenerate"],
//     //                                                         record["tag"],
//     //                                                         record["swaggerPR"],
//     //                                                         record["codePR"],
//     //                                                         record["ignoreFailure"],
//     //                                                         record["excludeStages"],
//     //                                                         record["pipelineBuildID"],
//     //                                                         record["status"]);
//     //             //codegens.push(cg);
//     //             break;
//     //         }
//     //     }
//     // });
//   } catch (e) {
//     console.log(e);
//     error = e;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();

//   return {
//     codegen: codegen,
//     err: undefined,
//   };
//   // return codegen;
// }

// /* get valid resource provider code-gen information. */
// export async function getAvailableCodeGeneration(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   resourceProvider: string,
//   sdk: string,
//   type: string
// ): Promise<{ codegen: CodeGeneration; err: any }> {
//   // let codegens: CodeGeneration[] = [];
//   let codegen: CodeGeneration = undefined;
//   let error: any = undefined;
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_SELECT_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, resourceProvider);
//     request.input("sdk", sql.VarChar, sdk);
//     request.input("type", sql.VarChar, type);

//     let result = await request.query(querystr);
//     for (let record of result.recordset) {
//       if (
//         record["status"] ===
//           CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
//         record["status"] ===
//           CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
//       ) {
//         continue;
//       }
//       codegen = new CodeGeneration(
//         record["resourceProvider"],
//         record["sdk"],
//         record["type"],
//         record["resourcesToGenerate"],
//         record["tag"],
//         record["swaggerPR"],
//         record["codePR"],
//         record["ignoreFailure"],
//         record["excludeStages"],
//         record["pipelineBuildID"],
//         record["status"]
//       );
//       //codegens.push(cg);
//       break;
//     }
//   } catch (e) {
//     console.log(e);
//     error = e;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();

//   return {
//     codegen: codegen,
//     err: undefined,
//   };
//   // return codegen;
// }

// /* update code-gen information. */
// export async function UpdateCodeGeneration(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   codegen: CodeGeneration
// ): Promise<any> {
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_UPDATE_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, codegen.resourceProvider);
//     request.input(
//       "resourcesToGenerate",
//       sql.VarChar,
//       codegen.resourcesToGenerate
//     );
//     request.input("tag", sql.VarChar, codegen.tag);
//     request.input("swaggerPR", sql.VarChar, codegen.swaggerPR);
//     request.input("codePR", sql.VarChar, codegen.codePR);
//     request.input("sdk", sql.VarChar, codegen.sdk);
//     request.input("type", sql.VarChar, codegen.type);
//     request.input("ignoreFailure", sql.VarChar, codegen.ignoreFailure);
//     request.input("excludeStages", sql.VarChar, codegen.excludeStages);
//     request.input("pipelineBuildID", sql.VarChar, codegen.pipelineBuildID);
//     request.input("status", sql.VarChar, codegen.status);

//     let { result, err } = await request.query(querystr);
//     if (err != undefined) {
//       console.log(err);
//       return err;
//     }
//   } catch (e) {
//     console.log(e);
//     if (conn !== undefined) await conn.close();
//     await sql.close();
//     return e;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();
//   return undefined;
// }

// /* update code-gen information. */
// export async function UpdateCodeGenerationValue(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   resourceProvider: string,
//   sdk: string,
//   type: string,
//   key: string,
//   value: string
// ): Promise<any> {
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_UPDATE_CODEGENERATION_VALUE,
//       table,
//       key,
//       key
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, resourceProvider);
//     request.input("sdk", sql.VarChar, sdk);
//     request.input("type", sql.VarChar, type);
//     request.input(key, sql.VarChar, value);

//     let { result, err } = await request.query(querystr);
//     if (err != undefined) {
//       console.log(err);
//       return err;
//     }
//   } catch (e) {
//     console.log(e);
//     if (conn !== undefined) await conn.close();
//     await sql.close();
//     return e;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();
//   return undefined;
// }

// /* update code-gen information. */
// export async function DeleteCodeGeneration(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   resourceProvider: string,
//   sdk: string,
//   type: string
// ): Promise<any> {
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_DELETE_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, resourceProvider);
//     request.input("sdk", sql.VarChar, sdk);
//     request.input("type", sql.VarChar, type);

//     let { result, err } = await request.query(querystr);
//     if (err != undefined) {
//       console.log(err);
//       return err;
//     }
//   } catch (e) {
//     console.log(e);
//     if (conn !== undefined) await conn.close();
//     await sql.close();
//     return e;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();
//   return undefined;
// }

// /* check if a running code generation exists or not. */
// export async function IsValidCodeGenerationExist(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   resourceProvider: string,
//   sdk: string,
//   type: string
// ): Promise<boolean> {
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_SELECT_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("resourceProvider", sql.VarChar, resourceProvider);
//     request.input("sdk", sql.VarChar, sdk);
//     request.input("type", sql.VarChar, type);

//     let result = await request.query(querystr);

//     if (result.recordset === undefined && result.recordset.length <= 0)
//       return false;
//     for (let record of result.recordset) {
//       const codegen = new CodeGeneration(
//         record["resourceProvider"],
//         record["sdk"],
//         record["type"],
//         record["resourcesToGenerate"],
//         record["tag"],
//         record["swaggerPR"],
//         record["codePR"],
//         record["ignoreFailure"],
//         record["excludeStages"],
//         record["pipelineBuildID"],
//         record["status"]
//       );
//       if (
//         codegen.status !==
//           CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
//         codegen.status !== CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
//       ) {
//         if (conn !== undefined) await conn.close();
//         return true;
//       }
//     }
//   } catch (e) {
//     console.log(e);
//     if (conn !== undefined) await conn.close();
//     await sql.close();
//     return false;
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();
//   return false;
// }

// /*Get all code generations of an special onboard type. */
// export async function ListCodeGenerations(
//   server: string,
//   database: string,
//   user: string,
//   password: string,
//   type: string,
//   filterCompleted: boolean = false
// ): Promise<CodeGeneration[]> {
//   let codegens: CodeGeneration[] = [];
//   var sql = require("mssql");
//   var config = {
//     user: user,
//     password: password,
//     server: server,
//     database: database,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_LIST_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("type", sql.VarChar, type);

//     let result = await request.query(querystr);

//     if (result.recordset === undefined || result.recordset.length === 0)
//       return codegens;
//     for (let record of result.recordset) {
//       if (filterCompleted) {
//         if (
//           record["status"] ===
//             CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
//           record["status"] ===
//             CodeGenerationStatus.CODE_GENERATION_STATUS_PIPELINE_COMPLETED
//         )
//           continue;
//       }
//       const codegen = new CodeGeneration(
//         record["resourceProvider"],
//         record["sdk"],
//         record["type"],
//         record["resourcesToGenerate"],
//         record["tag"],
//         record["swaggerPR"],
//         record["codePR"],
//         record["ignoreFailure"],
//         record["excludeStages"],
//         record["pipelineBuildID"],
//         record["status"]
//       );
//       codegens.push(codegen);
//     }
//   } catch (e) {
//     console.log(e);
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();
//   return codegens;
// }

// /*Get all code generations of an special status. */
// export async function ListCodeGenerationsByStatus(
//   credential: DBCredential,
//   status: string
// ): Promise<CodeGeneration[]> {
//   let codegens: CodeGeneration[] = [];
//   var sql = require("mssql");
//   var config = {
//     user: credential.user,
//     password: credential.pw,
//     server: credential.server,
//     database: credential.db,
//   };

//   let table: string = CodegenStatusTable;

//   let conn = undefined;
//   try {
//     conn = await sql.connect(config);

//     let querystr = require("util").format(
//       SQLStr.SQLSTR_LIST_CODEGENERATION,
//       table
//     );

//     const request = conn.request();
//     // request.input("table", sql.VarChar, table);
//     request.input("status", sql.VarChar, status);

//     let result = await request.query(querystr);

//     if (result.recordset !== undefined && result.recordset.length > 0)
//       return codegens;
//     for (let record of result.recordset) {
//       const codegen = new CodeGeneration(
//         record["resourceProvider"],
//         record["sdk"],
//         record["type"],
//         record["resourcesToGenerate"],
//         record["tag"],
//         record["swaggerPR"],
//         record["codePR"],
//         record["ignoreFailure"],
//         record["excludeStages"],
//         record["pipelineBuildID"],
//         record["status"]
//       );
//       codegens.push(codegen);
//     }
//   } catch (e) {
//     console.log(e);
//   }

//   if (conn !== undefined) await conn.close();
//   await sql.close();
//   return codegens;
// }

export function CollectPipelineStages(type: string, sdk: string): string[] {
  let stages: string[] = [];
  stages.push("Setup");
  stages.push("GenerateCode");
  if (needBuild(sdk)) {
    stages.push("Build");
  }
  stages.push("MockTest");
  stages.push("LiveTest");
  if (
    type === CodeGenerationType.DEPTH_COVERAGE ||
    type === CodeGenerationType.RELEASE
  ) {
    stages.push("Submit");
  }

  return stages;
}

export function needBuild(sdk: string): boolean {
  if (sdk === SDK.TF_SDK || sdk === SDK.DOTNET_SDK || sdk === SDK.GO_SDK)
    return true;
  else return false;
}
