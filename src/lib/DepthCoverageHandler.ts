import { NewOctoKit, listBranchs } from "../gitutil/GitAPI";
import { DeleteBranch } from "./CodeRepoGit";
import { DepthCoverageType, SQLQueryStr, Operation, Resource } from "./DepthCoverageModel";
import { ResourceAndOperation, OnboardOperation, OnboardResource } from "./Model";
import { CandidateResource } from "./ResourceCandiateModel";
import { AutorestSDK } from "./common";

export class DepthCoverageHandler {
    public async RetriveResourceToGenerate(server: string, db: string, user: string, pw: string, depthcoverageType: string, supportedResources:CandidateResource[] = undefined) : Promise<ResourceAndOperation[]>{
        const opOrresources:any[] = await this.QueryDepthCoverageReport(server, db, user, pw, depthcoverageType);
        //const supportedResource:Set<string> = new Set(["Microsoft.Security/devices", "Microsoft.Consumption/marketplaces", "Microsoft.CertificateRegistration/certificateOrders"]);
        // const supportedService:Set<string> = new Set(["compute", "authorization", "storage", "sql", "web", "keyvault","network", "resources"]);
        // const supportedService:Set<string> = new Set(["compute", "network"]);
        /*TODO: get the supported service from db. */
    
        let sdk = "";
        if (depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
            depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE) {
            sdk = AutorestSDK.AUTOREST_SDK_CLI_CORE;
        } else {
            sdk = AutorestSDK.AUTOREST_SDK_TF;
        }
        if (depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION 
            || depthcoverageType === DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION) {
            const res:ResourceAndOperation[] = await this.ConvertOperationToDepthCoverageResourceAndOperation(opOrresources, sdk, supportedResources);
            console.log(res);
            
            return res;
        } else {
            const res:ResourceAndOperation[] = await this.ConvertResourceToDepthCoverageResourceAndOperation(opOrresources, sdk, supportedResources);
            console.log(res);
            
            return res;
        }
        
    }

    public async DeleteAllDepthBranchs(token: string, org: string, repo: string) {
        const octo = NewOctoKit(token);
        let branches:string[] = await listBranchs(octo, org, repo);
        for (let branch of branches) {
            if (branch.startsWith("depth")) {
                await DeleteBranch(token, org, repo, branch);
            }
        }
    }

    public async QueryCandidateResources(server: string, database: string, user: string, password:string, depthcoverageType: string): Promise<CandidateResource[]> {
        let candidates: CandidateResource[] = [];
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
                let rs: CandidateResource = new CandidateResource(record["resourceProvider"], record["fullResourceType"], record["fileName"], record["apiVersion"], record["tag"]);
                candidates.push(rs);
            }
        }catch(e) {
            console.log(e);
        }
    
        return candidates;
    }
    
    public async QueryDepthCoverageReport(server: string, database: string, user: string, password:string, depthcoverageType: string): Promise<any[]> {
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
                    let op: Operation = new Operation(record["path"], record["fullResourceType"], record["operationName"], record["operationId"], record["fileName"]);
                    missing.push(op);
                }
            } else {
                for (let record of result.recordset) {
                    let rs: Resource = new Resource(record["fullResourceType"], record["fileName"]);
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
    
    public IsCandidateResource(candidates: CandidateResource[], resourceProvider:string, fullResourceType: string):boolean {
        for (let candidate of candidates) {
            if (candidate.resourceProvider === resourceProvider && (candidate.fullResourceType.toLowerCase() === "all" || candidate.fullResourceType === fullResourceType)) return true;
        }
    
        return false;
    }
    
    public GetCandidateResource(candidates: CandidateResource[], resourceProvider:string, fullResourceType: string): CandidateResource {
        if (candidates === undefined) return undefined;
        for (let candidate of candidates) {
            if (candidate.resourceProvider === resourceProvider && (candidate.fullResourceType.toLowerCase() === "all" || candidate.fullResourceType === fullResourceType)) return candidate;
        }
    
        return undefined;
    }
    
    public async ConvertOperationToDepthCoverageResourceAndOperation(ops: Operation[], sdk:string, supportedResource: CandidateResource[]=undefined): Promise<ResourceAndOperation[]> {
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
            if (supportedResource !== undefined && !this.IsCandidateResource(supportedResource, serviceName, op.fullResourceType)) continue;
            /* use api-version in candidate. */
            let candidate = this.GetCandidateResource(supportedResource, serviceName, op.fullResourceType);
            if (candidate !== undefined && candidate.apiVersion.toLowerCase() != "all") {
                apiVersion = candidate.apiVersion;
            }
            
            /*use tag in candidate. */
            let tag:string = undefined;
            if (candidate != undefined && candidate.tag !== undefined && candidate.tag !== null && candidate.tag.toLowerCase() != "all") {
                tag = candidate.tag;
            }
            let rp = this.GetResourceProvide(result, serviceName);
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
            let rs = this.GetResource(rp.resources, op.fullResourceType);
            if (rs !== undefined) {
                let find = this.GetOperation(rs.operations, op.operationId);
                if (find === undefined) {
                    rs.operations.push(new OnboardOperation(op.operationId, apiVersion, op.fileName));
                }
            } else {
                rs = new OnboardResource(op.fullResourceType, apiVersion);
                rs.operations.push(new OnboardOperation(op.operationId, apiVersion, op.fileName));
                rp.resources.push(rs);
            }
            if (tag !== undefined) rs.tag = tag;
            if (!this.Contains(rp.jsonFilelist, op.fileName)) rp.jsonFilelist.push(op.fileName);
        }
    
        return result;
    }
    
    public async ConvertResourceToDepthCoverageResourceAndOperation(resourcelist: Resource[], sdk:string, supportedResource: CandidateResource[]=undefined): Promise<ResourceAndOperation[]> {
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
            if (supportedResource !== undefined && !this.IsCandidateResource(supportedResource, serviceName, crs.fullResourceType)) continue;
            let candidate = this.GetCandidateResource(supportedResource, serviceName, crs.fullResourceType);
            /*use tag in candidate. */
            let tag:string = undefined;
            if (candidate !== undefined && candidate.tag !== undefined && candidate.tag !== null && candidate.tag.toLowerCase() != "all") {
                tag = candidate.tag;
            }
            let rp = this.GetResourceProvide(result, serviceName);
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
            let rs = this.GetResource(rp.resources, crs.fullResourceType);
            if (rs === undefined) {
                rs = new OnboardResource(crs.fullResourceType, apiVersion);
                rp.resources.push(rs);
                if (!this.Contains(rp.jsonFilelist, crs.fileName)) rp.jsonFilelist.push(crs.fileName);
            }
            if (tag !== undefined) rs.tag = tag;
        }
    
        return result;
    }
    
    public Contains(list: string[], target: string): boolean {
        for (let str of list) {
            if (str === target) return true;
        }
    
        return false;
    }
    public GetResourceProvide(resources: ResourceAndOperation[], rp: string) {
        for (let r of resources) {
            if (r.RPName === rp) return r;
        }
    
        return undefined;
    }
    public GetResource(resources: OnboardResource[], resource: string): OnboardResource {
        for (let r of resources) {
            if (r.Resource === resource) return r;
        }
        return undefined;
    }
    
    public GetOperation(operations: OnboardOperation[], id:string) {
        for (let op of operations) {
            if (op.OperationId === id) return op;
        }
    
        return undefined;
    }
}