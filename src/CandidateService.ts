import { readCVS, SQLStr, CandidateTable, SDK } from "./common";
import { CandidateResource } from "./depthcoverage/QueryDepthCoverageReport";

export async function IngestCandidatesFromFile(filepath:string, server: string, database: string, user: string, password:string, table: string) : Promise<any> {
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
        return e;
    }
    
    return undefined;
}

export async function IngestCandidates(candidates:CandidateResource[], server: string, database: string, user: string, password:string, sdk: string) : Promise<any>{
    var sql = require("mssql");
    var config = {
        user: user,
        password: password,
        server: server, 
        database: database 
    };

    let table: string = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    if (sdk === SDK.TF_SDK) {
        table = CandidateTable.TF_CANDIDATE_RESOURCE_TABLE;
    } else if (sdk === SDK.CLI_CORE_SDK) {
        table = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    }
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
            request.input('resourceProvider', sql.VarChar, candidate.resourceProvider);
            request.input('fullResourceName', sql.VarChar, candidate.fullResourceName);
            request.input('fileName', sql.VarChar, candidate.fileName);
            request.input('apiVersion', sql.VarChar, candidate.apiVersion);
            request.input('tag', sql.VarChar, candidate.tag);
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
        return e;
    } 

    return undefined;
}

export async function addCandidate(candidate:CandidateResource, server: string, database: string, user: string, password:string, sdk: string): Promise<any> {

    var sql = require("mssql");
    var config = {
        user: user,
        password: password,
        server: server, 
        database: database 
    };

    let table: string = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    if (sdk === SDK.TF_SDK) {
        table = CandidateTable.TF_CANDIDATE_RESOURCE_TABLE;
    } else if (sdk === SDK.CLI_CORE_SDK) {
        table = CandidateTable.CLI_CANDIDATE_RESOURCE_TABLE;
    }

    let conn = undefined;
    try {
        let conn = await sql.connect(config);
        /* delete existing one first. */
        let deletsqlstr = require('util').format(SQLStr.SQLSTR_DELETE, table, candidate.resourceProvider, candidate.fullResourceName);
        const delrequest = conn.request()
        let delresult = await delrequest.query(deletsqlstr, (err, result) => {
            if (err != undefined) {
                console.log(err);
            }
        });

        let querystr = require('util').format(SQLStr.SQLSTR_INSERT_CANDIDATE, table);
       
            
        const request = conn.request();
        request.input('table', sql.VarChar, table);
        request.input('resourceProvider', sql.VarChar, candidate.resourceProvider);
        request.input('fullResourceName', sql.VarChar, candidate.fullResourceName);
        request.input('fileName', sql.VarChar, candidate.fileName);
        request.input('apiVersion', sql.VarChar, candidate.apiVersion);
        request.input('tag', sql.VarChar, candidate.tag);
        request.input('startDate', sql.VarChar, candidate.startDate);
        request.input('endDate', sql.VarChar, candidate.endDate);
        let result = await request.query(querystr, (err, result) => {
            if (err != undefined) {
                console.log(err);
            }
        });
        
    }catch(e) {
        console.log(e);
        return e;
    }
    
    return undefined;
}