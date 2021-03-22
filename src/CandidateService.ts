import { readCVS, SQLStr } from "./common";

export async function IngestCandidates(filepath:string, server: string, database: string, user: string, password:string, table: string) {
    let candidates: any[] = readCVS(filepath);

    var sql = require("mssql");
    var config = {
        user: user,
        password: password,
        server: server, 
        database: database 
    };

    let conn = undefined;
    try {
        let conn = await sql.connect(config);
        let deletsqlstr = require('util').format(SQLStr.SQLSTR_CLEAR_CANDIDATE, table);
        const delrequest = conn.request()
        let delresult = await delrequest.query(deletsqlstr, (err, result) => {
            if (err != undefined) {
                console.log(err);
            }
        });

        let querystr = require('util').format(SQLStr.SQLSTR_INSERT_CANDIDATE, table);
        for (let candidate of candidates) {
            
            const request = conn.request();
            request.input('table', sql.VarChar, table);
            request.input('resourceProvider', sql.VarChar, candidate.RP);
            request.input('fullResourceName', sql.VarChar, candidate.fullResourceName);
            request.input('startDate', sql.VarChar, candidate.startDate);
            request.input('endDate', sql.VarChar, candidate.endDate);
            let result = await request.query(querystr, (err, result) => {
                if (err != undefined) {
                    console.log(err);
                }
            });
        }
    }catch(e) {
        console.log(e);
    }
    
}