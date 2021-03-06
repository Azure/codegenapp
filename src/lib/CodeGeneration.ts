import { CodegenStatusTable } from "./ResourceCandiateModel";
import { SQLStr } from "./common";
import { CodeGeneration, CodeGenerationStatus } from "./CodeGenerationModel";

export async function InsertCodeGeneration(
  server: string,
  database: string,
  user: string,
  password: string,
  codegen: CodeGeneration
): Promise<any> {
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_INSERT_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, codegen.resourceProvider);
    request.input(
      "resourcesToGenerate",
      sql.VarChar,
      codegen.resourcesToGenerate
    );
    request.input("tag", sql.VarChar, codegen.tag);
    request.input("swaggerPR", sql.VarChar, codegen.swaggerPR);
    request.input("codePR", sql.VarChar, codegen.codePR);
    request.input("sdk", sql.VarChar, codegen.sdk);
    request.input("type", sql.VarChar, codegen.type);
    request.input("ignoreFailure", sql.VarChar, codegen.ignoreFailure);
    request.input("excludeStages", sql.VarChar, codegen.excludeStages);
    request.input("pipelineBuildID", sql.VarChar, codegen.pipelineBuildID);
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

/* get resource provider code-gen information. */
export async function getCodeGeneration(
  server: string,
  database: string,
  user: string,
  password: string,
  resourceProvider: string,
  sdk: string,
  type: string
): Promise<{ codegen: CodeGeneration; err: any }> {
  // let codegens: CodeGeneration[] = [];
  let codegen: CodeGeneration = undefined;
  let error: any = undefined;
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_SELECT_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, resourceProvider);
    request.input("sdk", sql.VarChar, sdk);
    request.input("type", sql.VarChar, type);

    let result = await request.query(querystr);
    for (let record of result.recordset) {
      codegen = new CodeGeneration(
        record["resourceProvider"],
        record["sdk"],
        record["type"],
        record["resourcesToGenerate"],
        record["tag"],
        record["swaggerPR"],
        record["codePR"],
        record["ignoreFailure"],
        record["excludeStages"],
        record["pipelineBuildID"],
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

/* get valid resource provider code-gen information. */
export async function getAvailableCodeGeneration(
  server: string,
  database: string,
  user: string,
  password: string,
  resourceProvider: string,
  sdk: string,
  type: string
): Promise<{ codegen: CodeGeneration; err: any }> {
  // let codegens: CodeGeneration[] = [];
  let codegen: CodeGeneration = undefined;
  let error: any = undefined;
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_SELECT_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, resourceProvider);
    request.input("sdk", sql.VarChar, sdk);
    request.input("type", sql.VarChar, type);

    let result = await request.query(querystr);
    for (let record of result.recordset) {
      if (
        record["status"] ===
          CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED ||
        record["status"] ===
          CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
      ) {
        continue;
      }
      codegen = new CodeGeneration(
        record["resourceProvider"],
        record["sdk"],
        record["type"],
        record["resourcesToGenerate"],
        record["tag"],
        record["swaggerPR"],
        record["codePR"],
        record["ignoreFailure"],
        record["excludeStages"],
        record["pipelineBuildID"],
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
export async function UpdateCodeGeneration(
  server: string,
  database: string,
  user: string,
  password: string,
  codegen: CodeGeneration
): Promise<any> {
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_UPDATE_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, codegen.resourceProvider);
    request.input(
      "resourcesToGenerate",
      sql.VarChar,
      codegen.resourcesToGenerate
    );
    request.input("tag", sql.VarChar, codegen.tag);
    request.input("swaggerPR", sql.VarChar, codegen.swaggerPR);
    request.input("codePR", sql.VarChar, codegen.codePR);
    request.input("sdk", sql.VarChar, codegen.sdk);
    request.input("type", sql.VarChar, codegen.type);
    request.input("ignoreFailure", sql.VarChar, codegen.ignoreFailure);
    request.input("excludeStages", sql.VarChar, codegen.excludeStages);
    request.input("pipelineBuildID", sql.VarChar, codegen.pipelineBuildID);
    request.input("status", sql.VarChar, codegen.status);

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
export async function UpdateCodeGenerationValue(
  server: string,
  database: string,
  user: string,
  password: string,
  resourceProvider: string,
  sdk: string,
  type: string,
  key: string,
  value: string
): Promise<any> {
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_UPDATE_CODEGENERATION_VALUE,
      table,
      key,
      key
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, resourceProvider);
    request.input("sdk", sql.VarChar, sdk);
    request.input("type", sql.VarChar, type);
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
export async function DeleteCodeGeneration(
  server: string,
  database: string,
  user: string,
  password: string,
  resourceProvider: string,
  sdk: string,
  type: string
): Promise<any> {
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_DELETE_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, resourceProvider);
    request.input("sdk", sql.VarChar, sdk);
    request.input("type", sql.VarChar, type);

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

/* check if a running code generation exists or not. */
export async function IsValidCodeGenerationExist(
  server: string,
  database: string,
  user: string,
  password: string,
  resourceProvider: string,
  sdk: string,
  type: string
): Promise<boolean> {
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_SELECT_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("resourceProvider", sql.VarChar, resourceProvider);
    request.input("sdk", sql.VarChar, sdk);
    request.input("type", sql.VarChar, type);

    let result = await request.query(querystr);

    if (result.recordset === undefined && result.recordset.length <= 0)
      return false;
    for (let record of result.recordset) {
      const codegen = new CodeGeneration(
        record["resourceProvider"],
        record["sdk"],
        record["type"],
        record["resourcesToGenerate"],
        record["tag"],
        record["swaggerPR"],
        record["codePR"],
        record["ignoreFailure"],
        record["excludeStages"],
        record["pipelineBuildID"],
        record["status"]
      );
      if (
        codegen.status !==
          CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
        codegen.status !== CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
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
export async function ListCodeGenerations(
  server: string,
  database: string,
  user: string,
  password: string,
  type: string,
  filterCompleted: boolean = false
): Promise<CodeGeneration[]> {
  let codegens: CodeGeneration[] = [];
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_LIST_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("type", sql.VarChar, type);

    let result = await request.query(querystr);

    if (result.recordset !== undefined && result.recordset.length > 0)
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
      const codegen = new CodeGeneration(
        record["resourceProvider"],
        record["sdk"],
        record["type"],
        record["resourcesToGenerate"],
        record["tag"],
        record["swaggerPR"],
        record["codePR"],
        record["ignoreFailure"],
        record["excludeStages"],
        record["pipelineBuildID"],
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
export async function ListCodeGenerationsByStatus(
  server: string,
  database: string,
  user: string,
  password: string,
  status: string
): Promise<CodeGeneration[]> {
  let codegens: CodeGeneration[] = [];
  var sql = require("mssql");
  var config = {
    user: user,
    password: password,
    server: server,
    database: database,
  };

  let table: string = CodegenStatusTable;

  let conn = undefined;
  try {
    conn = await sql.connect(config);

    let querystr = require("util").format(
      SQLStr.SQLSTR_LIST_CODEGENERATION,
      table
    );

    const request = conn.request();
    // request.input("table", sql.VarChar, table);
    request.input("status", sql.VarChar, status);

    let result = await request.query(querystr);

    if (result.recordset !== undefined && result.recordset.length > 0)
      return codegens;
    for (let record of result.recordset) {
      const codegen = new CodeGeneration(
        record["resourceProvider"],
        record["sdk"],
        record["type"],
        record["resourcesToGenerate"],
        record["tag"],
        record["swaggerPR"],
        record["codePR"],
        record["ignoreFailure"],
        record["excludeStages"],
        record["pipelineBuildID"],
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
