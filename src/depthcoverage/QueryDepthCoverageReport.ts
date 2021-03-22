// import { SQLServerConnection } from "./SqlServerConnect";
import sql from "mssql"

export class ResourceAndOperation {
    public constructor(RPName: string, readme:string, resources: DepthCoverageResource[], target: string) {
        this.RPName = RPName;
        this.readmeFile = readme;
        this.resources = resources;
        this.target = target;
    }
    public RPName: string;
    public readmeFile: string;
    public target: string;
    public resources: DepthCoverageResource[] = [];
    public ignoreFailures: string;
    public excludeStages: string;
    public tag:string;
    // public Resource: string;
    // public operations: DepthCoverageOperation[] = [];
}
export class DepthCoverageResource {
    public constructor(rs: string, version: string) {
        this.Resource = rs;
        this.APIVersion = version;
    }
    public Resource: string;
    public APIVersion: string = undefined;
    public operations: DepthCoverageOperation[] = [];
    public tag:string;
}
export class DepthCoverageOperation {
    public constructor(id:string, version:string, jsonfile: string) {
        this.OperationId = id;
        this.version = version;
        this.jsonFilePath = jsonfile;
    }
    public OperationId: string;
    public version: string;
    public jsonFilePath: string;
}

/* the operation schema in depth coverage db. */
export class Operation {
    public constructor(path:string, resouceName: string, name: string, id: string, filename: string) {
        this.path = path;
        this.fullResourceName = resouceName;
        this.operationName = name;
        this.operationId= id;
        this.fileName = filename;
    }
    public path: string = undefined;
    public fullResourceName: string = undefined;
    public operationName: string = undefined;
    public operationId: string = undefined;
    public fileName: string = undefined;
}

/* the resource schema in depth coverage db. */
export class Resource {
    public constructor(resource: string, filename: string) {
        this.fullResourceName = resource;
        this.fileName = filename;
    }
    public fullResourceName: string = undefined;
    public fileName: string = undefined;
}

export enum AutorestSDK {
    AUTOREST_SDK_TF = "terraform",
    AUTOREST_SDK_CLI_CORE = "clicore",
    AUTOREST_SDK_CLI_EXTENSION = "cliextension"
}

export enum SQLQueryStr {
    SQLQUERY_TF_NOT_SUPPORT_RESOURCE = "select fullResourceName, fileName from AMEClientTools_Coverage_Result_TFNotSupportedResources",
    SQLQUERY_TF_NOT_SUPPORT_OPERATION = "select path, fullResourceName, operationName, operationId, fileName from AMEClientTools_Coverage_Result_TFNotSupportedOperations order by path",
    SQLQUERY_CLI_NOT_SUPPORT_OPERATION = "select path, fullResourceName, operationName, operationId, fileName from AMEClientTools_Coverage_Result_CLINotSupportedOperations order by path",
    SQLQUERY_CLI_NOT_SUPPOT_RESOURCE = "select fullResourceName, fileName from AMEClientTools_Coverage_Result_CLINotSupportedResources",
    SQLQUERY_CLI_CANDIDATE_OPERATION = "select * from AMEClientTools_Coverage_CLICandidateOperations",
    SQLQUERY_TF_CANDIDATE_RESOURCE="select * from AMEClientTools_Coverage_TFCandidateResources"
}

export enum DepthCoverageType {
    DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE = "TF_NOT_SUPPORT_RESOURCE",
    DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION = "TF_NOT_SUPPORT_OPERATION",
    DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION = "CLI_NOT_SUPPORT_OPERATION",
    DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE = "CLI_NOT_SUPPOT_RESOURCE"
}

export class CandidateResources {
    public constructor(rp: string, rs: string, apiversion: string = "ALL", tag:string = "ALL") {
        this.resourceProvider = rp;
        this.fullResourceName = rs;
        this.apiVersion = apiversion;
        this.tag = tag;
    }
    public resourceProvider: string;
    public fullResourceName: string;
    public apiVersion: string;
    public tag:string;
}
export async function QueryCandidateResources(server: string, database: string, user: string, password:string, depthcoverageType: string): Promise<CandidateResources[]> {
    let candidates: CandidateResources[] = [];
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

        let queryStr = "";
        switch (depthcoverageType) {
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE:
                queryStr = SQLQueryStr.SQLQUERY_TF_CANDIDATE_RESOURCE;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION:
                queryStr = SQLQueryStr.SQLQUERY_TF_CANDIDATE_RESOURCE;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE:
                queryStr = SQLQueryStr.SQLQUERY_CLI_CANDIDATE_OPERATION;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION:
                queryStr = SQLQueryStr.SQLQUERY_CLI_CANDIDATE_OPERATION;
                break;
            default:
        }


        let result = await conn.request()
                            .query(queryStr);
        for (let record of result.recordset) {
            let rs: CandidateResources = new CandidateResources(record["resourceProvider"], record["fullResourceName"], record["apiVersion"], record["tag"]);
            candidates.push(rs);
        }
    }catch(e) {
        console.log(e);
    }

    return candidates;
}

export async function QueryDepthCoverageReport(server: string, database: string, user: string, password:string, depthcoverageType: string): Promise<any[]> {
    let missing: any[] = [];
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

        let queryStr = "";
        let sdk = "";
        switch (depthcoverageType) {
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE:
                queryStr = SQLQueryStr.SQLQUERY_TF_NOT_SUPPORT_RESOURCE;
                sdk=AutorestSDK.AUTOREST_SDK_TF;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION:
                queryStr = SQLQueryStr.SQLQUERY_TF_NOT_SUPPORT_OPERATION;
                sdk=AutorestSDK.AUTOREST_SDK_TF;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE:
                queryStr = SQLQueryStr.SQLQUERY_CLI_NOT_SUPPOT_RESOURCE;
                sdk=AutorestSDK.AUTOREST_SDK_CLI_CORE;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION:
                queryStr = SQLQueryStr.SQLQUERY_CLI_NOT_SUPPORT_OPERATION;
                sdk=AutorestSDK.AUTOREST_SDK_CLI_CORE;
                break;
            default:
        }


        let result = await conn.request()
                            .query(queryStr);

        if (depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION 
            || depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION) {
            for (let record of result.recordset) {
                let op: Operation = new Operation(record["path"], record["fullResourceName"], record["operationName"], record["operationId"], record["fileName"]);
                missing.push(op);
            }
        } else {
            for (let record of result.recordset) {
                let rs: Resource = new Resource(record["fullResourceName"], record["fileName"]);
                missing.push(rs);
            }
        }
        
    } catch(e) {
        console.log(e);
        if (conn !== undefined) conn.close();
        sql.close();
    }
    
    console.log("missing:" + missing.length);
    return missing;
}

function IsCandidateResource(candidates: CandidateResources[], resourceProvider:string, fullResourceName: string):boolean {
    for (let candidate of candidates) {
        if (candidate.resourceProvider === resourceProvider && (candidate.fullResourceName.toLowerCase() === "all" || candidate.fullResourceName === fullResourceName)) return true;
    }

    return false;
}

function GetCandidateResource(candidates: CandidateResources[], resourceProvider:string, fullResourceName: string): CandidateResources {
    for (let candidate of candidates) {
        if (candidate.resourceProvider === resourceProvider && (candidate.fullResourceName.toLowerCase() === "all" || candidate.fullResourceName === fullResourceName)) return candidate;
    }

    return undefined;
}

export async function ConvertOperationToDepthCoverageResourceAndOperation(ops: Operation[], sdk:string, supportedResource: CandidateResources[]=undefined): Promise<ResourceAndOperation[]> {
    let result: ResourceAndOperation[] = [];
    const specFileRegex = "(specification/)+(.*)/(resourcemanager|resource-manager|dataplane|data-plane|control-plane)/(.*)/(preview|stable|privatepreview)/(.*?)/(example)?(.*)";
    for (let op of ops) {
        let m = op.fileName.match(specFileRegex);
        if (!m) {
            console.warn(`\tFail to parse swagger file json ${op.fileName}`);
            continue;
        }
        let [
            path,
            ,
            serviceName,
            serviceType,
            resourceProvider,
            releaseState,
            apiVersion,
            ,
            fileName,
          ] = m;
        // console.log("path:" + path);
        // console.log("serviceName:" + serviceName);
        // console.log("serviceType:" + serviceType);
        // console.log("resourceProvider:" + resourceProvider);
        // console.log("releaseState:" + releaseState);
        // console.log("apiVersion:" + apiVersion);
        // console.log("fileName:" + fileName);
        if (supportedResource !== undefined && !IsCandidateResource(supportedResource, serviceName, op.fullResourceName)) continue;
        /* use api-version in candidate. */
        let candidate = GetCandidateResource(supportedResource, serviceName, op.fullResourceName);
        if (candidate.apiVersion.toLowerCase() != "all") {
            apiVersion = candidate.apiVersion;
        }
        
        /*use tag in candidate. */
        let tag:string = undefined;
        if (candidate.tag !== undefined && candidate.tag !== null && candidate.tag.toLowerCase() != "all") {
            tag = candidate.tag;
        }
        let rp = GetResourceProvide(result, serviceName);
        if (rp === undefined) {
            let readme = op.fileName.split('/').slice(0, 4).join('/') + "/readme.md";
            rp = new ResourceAndOperation(serviceName, readme, [], sdk);
            result.push(rp);
        }
        if (tag !== undefined) {
            if (rp.tag === undefined) {
                rp.tag = tag;
            } else if (rp.tag.indexOf(tag) === -1) {
                rp.tag = rp.tag + ";" + tag;
            }
        }
        let rs = GetResource(rp.resources, op.fullResourceName);
        if (rs !== undefined) {
            let find = GetOperation(rs.operations, op.operationId);
            if (find === undefined) {
                rs.operations.push(new DepthCoverageOperation(op.operationId, apiVersion, op.fileName));
            }
        } else {
            rs = new DepthCoverageResource(op.fullResourceName, apiVersion);
            rs.operations.push(new DepthCoverageOperation(op.operationId, apiVersion, op.fileName));
            rp.resources.push(rs);
        }
        if (tag !== undefined) rs.tag = tag;
    }

    return result;
}

export async function ConvertResourceToDepthCoverageResourceAndOperation(resourcelist: Resource[], sdk:string, supportedResource: CandidateResources[]=undefined): Promise<ResourceAndOperation[]> {
    let result: ResourceAndOperation[] = [];
    const specFileRegex = "(specification/)+(.*)/(resourcemanager|resource-manager|dataplane|data-plane|control-plane)/(.*)/(preview|stable|privatepreview)/(.*?)/(example)?(.*)";
    for (let crs of resourcelist) {
        let m = crs.fileName.match(specFileRegex);
        if (!m) {
            console.warn(`\tFail to parse swagger file json ${crs.fileName}`);
            continue;
        }
        const [
            path,
            ,
            serviceName,
            serviceType,
            resourceProvider,
            releaseState,
            apiVersion,
            ,
            fileName,
          ] = m;
        // console.log("path:" + path);
        // console.log("serviceName:" + serviceName);
        // console.log("serviceType:" + serviceType);
        // console.log("resourceProvider:" + resourceProvider);
        // console.log("releaseState:" + releaseState);
        // console.log("apiVersion:" + apiVersion);
        // console.log("fileName:" + fileName);
        if (supportedResource !== undefined && !IsCandidateResource(supportedResource, serviceName, crs.fullResourceName)) continue;
        let candidate = GetCandidateResource(supportedResource, serviceName, crs.fullResourceName);
        /*use tag in candidate. */
        let tag:string = undefined;
        if (candidate.tag !== undefined && candidate.tag !== null && candidate.tag.toLowerCase() != "all") {
            tag = candidate.tag;
        }
        let rp = GetResourceProvide(result, serviceName);
        if (rp === undefined) {
            let readme = crs.fileName.split('/').slice(0, 4).join('/') + "/readme.md";
            rp = new ResourceAndOperation(serviceName, readme, [], sdk);
            result.push(rp);
        }
        if (tag !== undefined) {
            if (rp.tag === undefined) {
                rp.tag = tag;
            } else if (rp.tag.indexOf(tag) === -1) {
                rp.tag = rp.tag + ";" + tag;
            }
        }
        let rs = GetResource(rp.resources, crs.fullResourceName);
        if (rs === undefined) {
            rs = new DepthCoverageResource(crs.fullResourceName, apiVersion);
            rp.resources.push(rs);
        }
        if (tag !== undefined) rs.tag = tag;
    }

    return result;
}
function GetResourceProvide(resources: ResourceAndOperation[], rp: string) {
    for (let r of resources) {
        if (r.RPName === rp) return r;
    }

    return undefined;
}
function GetResource(resources: DepthCoverageResource[], resource: string): DepthCoverageResource {
    for (let r of resources) {
        if (r.Resource === resource) return r;
    }
    return undefined;
}

function GetOperation(operations: DepthCoverageOperation[], id:string) {
    for (let op of operations) {
        if (op.OperationId === id) return op;
    }

    return undefined;
}