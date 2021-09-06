import exp = require("node:constants");
import { readCVS, SDK, SQLStr } from "../common";
import { CandidateResource, CandidateTable } from "../ResourceCandiateModel";
import { DBCredential, DepthDBCredentials } from "./DBCredentials";

export class DepthCandidateTable {
  public constructor() {}

  public async IngestCandidatesFromFile(
    filepath: string,
    credential: DBCredential,
    table: string
  ): Promise<any> {
    let candidates: any[] = readCVS(filepath);

    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let conn = undefined;
    try {
      conn = await sql.connect(config);
      let deletsqlstr = require("util").format(
        SQLStr.SQLSTR_CLEAR_CANDIDATE,
        table
      );
      const delrequest = conn.request();
      let delresult = await delrequest.query(deletsqlstr, (err, result) => {
        if (err != undefined) {
          console.log(err);
        }
      });

      let querystr = require("util").format(
        SQLStr.SQLSTR_INSERT_CANDIDATE,
        table
      );
      for (let candidate of candidates) {
        const request = conn.request();
        request.input("table", sql.VarChar, table);
        request.input("resourceProvider", sql.VarChar, candidate.RP);
        request.input(
          "fullResourceType",
          sql.VarChar,
          candidate.fullResourceType
        );
        request.input("startDate", sql.VarChar, candidate.startDate);
        request.input("endDate", sql.VarChar, candidate.endDate);
        let result = await request.query(querystr, (err, result) => {
          if (err != undefined) {
            console.log(err);
          }
        });
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

  public async IngestCandidates(
    candidates: CandidateResource[],
    credential: DBCredential,
    sdk: string
  ): Promise<any> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    if (sdk === SDK.TF_SDK) {
      table = CandidateTable.TF_CANDIDATE_RESOURCE_TABLE;
    } else if (sdk === SDK.CLI_CORE_SDK) {
      table = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    }
    let conn = undefined;
    try {
      conn = await sql.connect(config);
      let deletsqlstr = require("util").format(
        SQLStr.SQLSTR_CLEAR_CANDIDATE,
        table
      );
      const delrequest = conn.request();
      // let delresult = await delrequest.query(deletsqlstr, (err, result) => {
      //     if (err != undefined) {
      //         console.log(err);
      //     }
      // });
      let { delresult, err } = await delrequest.query(deletsqlstr);
      if (err != undefined) {
        console.log(err);
      }

      let querystr = require("util").format(
        SQLStr.SQLSTR_INSERT_CANDIDATE,
        table
      );
      for (let candidate of candidates) {
        const request = conn.request();
        request.input("table", sql.VarChar, table);
        request.input(
          "resourceProvider",
          sql.VarChar,
          candidate.resourceProvider
        );
        request.input(
          "fullResourceType",
          sql.VarChar,
          candidate.fullResourceType
        );
        request.input("fileName", sql.VarChar, candidate.fileName);
        request.input("apiVersion", sql.VarChar, candidate.apiVersion);
        request.input("tag", sql.VarChar, candidate.tag);
        request.input("startDate", sql.VarChar, candidate.startDate);
        request.input("endDate", sql.VarChar, candidate.endDate);
        // let result = await request.query(querystr, (err, result) => {
        //     if (err != undefined) {
        //         console.log(err);
        //     }
        // });
        let { result, err } = await request.query(querystr);
        if (err != undefined) {
          console.log(err);
        }
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

  public async addCandidate(
    candidate: CandidateResource,
    credential: DBCredential,
    sdk: string
  ): Promise<any> {
    var sql = require("mssql");
    var config = {
      user: credential.user,
      password: credential.pw,
      server: credential.server,
      database: credential.db,
    };

    let table: string = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    if (sdk === SDK.TF_SDK) {
      table = CandidateTable.TF_CANDIDATE_RESOURCE_TABLE;
    } else if (sdk === SDK.CLI_CORE_SDK) {
      table = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    }

    let conn = undefined;
    try {
      conn = await sql.connect(config);
      /* delete existing one first. */
      let deletsqlstr = require("util").format(
        SQLStr.SQLSTR_DELETE,
        table,
        candidate.resourceProvider,
        candidate.fullResourceType
      );
      const delrequest = conn.request();
      // let delresult = await delrequest.query(deletsqlstr, (err, result) => {
      //     if (err != undefined) {
      //         console.log(err);
      //     }
      // });
      let { delresult, delerr } = await delrequest.query(deletsqlstr);
      if (delerr != undefined) {
        console.log(delerr);
      }

      let querystr = require("util").format(
        SQLStr.SQLSTR_INSERT_CANDIDATE,
        table
      );

      const request = conn.request();
      request.input("table", sql.VarChar, table);
      request.input(
        "resourceProvider",
        sql.VarChar,
        candidate.resourceProvider
      );
      request.input(
        "fullResourceType",
        sql.VarChar,
        candidate.fullResourceType
      );
      request.input("fileName", sql.VarChar, candidate.fileName);
      request.input("apiVersion", sql.VarChar, candidate.apiVersion);
      request.input("tag", sql.VarChar, candidate.tag);
      request.input("startDate", sql.VarChar, candidate.startDate);
      request.input("endDate", sql.VarChar, candidate.endDate);
      // let result = await request.query(querystr, (err, result) => {
      //     if (err != undefined) {
      //         console.log(err);
      //     }
      // });
      let { result, err } = await request.query(querystr);
      if (err != undefined) {
        console.log(err);
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
}

export default new DepthCandidateTable();
