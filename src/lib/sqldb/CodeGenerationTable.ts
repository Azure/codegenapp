import { CodegenStatusTable, sdkCodegenTable } from "../ResourceCandiateModel";
import { CodeGenerationPipelineTaskName, CodeGenerationType, SDK, SQLStr } from "../common";
import {
  CodeGeneration,
  CodeGenerationDBColumn,
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
    filters: {} = undefined,
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
      if (filters !== undefined && Object.keys(filters).length > 0) {
        querystr = querystr + " where %s";
        let keys = Object.keys(filters);
        let sql_filter_parameters: string[] = [];
        for (const key of keys) {
          if (key === CodeGenerationDBColumn.CODE_GENERATION_COLUMN_OWNER) {
            // sql_filter_parameters.push(`(${key} like '%@${key};%' or ${key} like '%@${key}%')`);
            sql_filter_parameters.push(`(${key} like '%${filters[key]};%' or ${key} like '%${filters[key]}%')`);
          } else {
            sql_filter_parameters.push(key + "=@" + key);
          }
          request.input(key, sql.VarChar, filters[key]);
        }
        console.log("sql statememnt: " + sql_filter_parameters.join(" and "));
        querystr = require("util").format(
          querystr,
          sql_filter_parameters.join(" and ")
        );
      }

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


export function CollectPipelineStages(type: string, sdk: string): string[] {
  let stages: string[] = [];
  stages.push(CodeGenerationPipelineTaskName.SET_UP);
  stages.push(CodeGenerationPipelineTaskName.GENERATE_CODE);
  if (needBuild(sdk)) {
    stages.push(CodeGenerationPipelineTaskName.BUILD);
  }
  if (applyTest(sdk)) {
    stages.push(CodeGenerationPipelineTaskName.MOCK_TEST);
    stages.push(CodeGenerationPipelineTaskName.LIVE_TEST);
  }
  
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

export function applyTest(sdk: string) : boolean {
  if (sdk === SDK.DOTNET_SDK) return false;
  else return true;
}
