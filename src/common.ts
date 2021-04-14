import fs = require('fs');
import csv = require('csv-parser');
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from '@azure/keyvault-secrets';

export enum ENVKEY {
    ENV_DEPTH_DB_SERVER="DepthDBServer",
    ENV_DEPTH_DATABASE="DepthDatabase",
    ENV_DEPTH_DB_USER="DepthDBUsername",
    ENV_DEPTH_DB_PASSWORD="DepthDBPassword",
    ENV_REPO_ACCESS_TOKEN="RepoAccessToken",
    ENV_CODEGEN_DB_SERVER="DBServer",
    ENV_CODEGEN_DATABASE="Database",
    ENV_CODEGEN_DB_USER="DBUsername",
    ENV_CODEGEN_DB_PASSWORD="DBPassword",
}
export class ResourceAndOperation {
    public constructor(RPName: string, readme:string, resources: OnboardResource[], target: string) {
        this.RPName = RPName;
        this.readmeFile = readme;
        this.resources = resources;
        this.target = target;
    }
    public RPName: string;
    public readmeFile: string;
    public target: string;
    public resources: OnboardResource[] = [];
    public ignoreFailures: string;
    public excludeStages: string;
    public tag:string;
    public resourcelist:string="";
    public jsonFilelist: string[] = [];
    public onboardType: string = OnboardType.DEPTH_COVERAGE;
    // public Resource: string;
    // public operations: DepthCoverageOperation[] = [];
    public generateResourceList() {
        for (let r of this.resources) {
            if (this.resourcelist.length === 0) {
                this.resourcelist = r.Resource;
            } else {
                this.resourcelist = this.resourcelist + "," + r.Resource;
            }
        }
    }
}

export class OnboardResource {
    public constructor(rs: string, version: string) {
        this.Resource = rs;
        this.APIVersion = version;
    }
    public Resource: string;
    public APIVersion: string = undefined;
    public operations: OnboardOperation[] = [];
    public tag:string;
}
export class OnboardOperation {
    public constructor(id:string, version:string, jsonfile: string) {
        this.OperationId = id;
        this.version = version;
        this.jsonFilePath = jsonfile;
    }
    public OperationId: string;
    public version: string;
    public jsonFilePath: string;
}

export class CodeGeneration {
    public constructor(rs: string, 
                        sdk: string, 
                        type: string = "depth",
                        resourcesToGenerate:string = "",
                        tag:string = "",
                        swaggerPR:string = "",
                        codePR: string = "",
                        ignoreFailure: string = "",
                        excludeStages: string = "",
                        pipelineBuildID: string = "",
                        status: string = "submit") {
        this.resourceProvider = rs;
        this.sdk = sdk;
        this.type = type;
        this.resourcesToGenerate = resourcesToGenerate;
        this.tag = tag;
        this.swaggerPR = swaggerPR;
        this.codePR = codePR;
        this.ignoreFailure = ignoreFailure;
        this.excludeStages = excludeStages;
        this.pipelineBuildID = pipelineBuildID;
        this.status = status;
    }
    public resourceProvider: string;
    public resourcesToGenerate: string = "ALL";
    public tag: string;
    public swaggerPR: string;
    public codePR: string;
    public sdk: string;
    public type: string;
    public ignoreFailure: string;
    public excludeStages: string;
    public pipelineBuildID: string;
    public status: string;
}

export enum CodeGenerationStatus {
    CODE_GENERATION_STATUS_SUBMIT="submit",
    CODE_GENERATION_STATUS_IN_PROGRESS="inprogress",
    CODE_GENERATION_STATUS_CUSTOMIZING="customizing",
    CODE_GENERATION_STATUS_FAILED="failed",
    CODE_GENERATION_STATUS_PIPELINE_COMPLETED="pipelineCompleted",
    CODE_GENERATION_STATUS_COMPLETED="completed"
}

export enum CodeGenerationDBColumn {
    CODE_GENERATION_COLUMN_RESOURCE_PROVIDER="resourceProvider",
    CODE_GENERATION_COLUMN_RESOURCETOGENERATE="resourcesToGenerate",
    CODE_GENERATION_COLUMN_TAG="tag",
    CODE_GENERATION_COLUMN_SWAGGER_PULLREQUEST="swaggerPR",
    CODE_GENERATION_COLUMN_CODE_PULLREQUEST="codePR",
    CODE_GENERATION_COLUMN_SDK="sdk",
    CODE_GENERATION_COLUMN_TYPE="type",
    CODE_GENERATION_COLUMN_IGNOAREFAILURE="ignoreFailure",
    CODE_GENEERTION_COLUMN_EXCLUDESTAGES="excludeStages",
    CODE_GENERATION_COLUMN_PIPELINEBUILDID="pipelineBuildID",
    CODE_GENERATION_COLUMN_STATUS="status"
}
export enum REPO {
    SWAGGER_REPO="azure-rest-api-specs",
    TF_PROVIDER_REPO= "terraform-provider-azurerm",
    CLI_REPO = "azure-cli",
    DEPTH_COVERAGE_REPO = "depth-coverage-pipeline"
  }
  
export enum ORG {
    AZURE = "Azure",
    MS = "microsoft"
}
  
export enum SDK {
    TF_SDK="terraform",
    CLI_CORE_SDK="clicore",
    CLI_EXTENSTION_SDK="cliextension"
}
  
export enum README {
    TF_README_FILE="readme.terraform.md",
    CLI_README_FILE="readme.az.md"
}

export enum SQLStr {
    /*access depth coverage candidate table. */
    SQLSTR_INSERT_CANDIDATE = "INSERT INTO %s (resourceProvider, fullResourceName, fileName, apiVersion, tag, startDate, endDate) values (@resourceProvider, @fullResourceName, @fileName, @apiVersion, @tag, @startDate, @endDate)",
    SQLSTR_CLEAR_CANDIDATE = "DElETE from %s",
    SQLSTR_DELETE = "DELETE from %s where resourceProvider='%s' and fullResourceName='%s'",

    /*access code generation status table. */
    SQLSTR_INSERT_CODEGENERATION = "INSERT INTO %s (resourceProvider, resourcesToGenerate, tag, swaggerPR, codePR, sdk, type, ignoreFailure, excludeStages, pipelineBuildID, status) values (@resourceProvider, @resourcesToGenerate, @tag, @swaggerPR, @codePR, @sdk, @type, @ignoreFailure, @excludeStages, @pipelineBuildID, @status)",
    SQLSTR_UPDATE_CODEGENERATION = "UPDATE %s SET resourcesToGenerate=@resourcesToGenerate, tag=@tag, swaggerPR=@swaggerPR, codePR=@codePR, ignoreFailure=@ignoreFailure, excludeStages=@excludeStages, pipelineBuildID=@pipelineBuildID, status=@status where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
    SQLSTR_DELETE_CODEGENERATION = "DELETE FROM %s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
    SQLSTR_SELECT_CODEGENERATION = "SELECT * FROM %s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
    SQLSTR_UPDATE_CODEGENERATION_VALUE = "UPDATE %s SET %s=@%s where resourceProvider=@resourceProvider and type=@type and sdk=@sdk",
}

export enum OnboardType {
    DEPTH_COVERAGE = "depth",
    ADHOC_ONBOARD = "onboard"
}

export enum CandidateTable {
    CLI_CANDIDATE_RESOURCE_TABLE="AMEClientTools_Coverage_CLICandidateOperations",
    TF_CANDIDATE_RESOURCE_TABLE="AMEClientTools_Coverage_TFCandidateResources"
}
export const CodegenStatusTable = "AMEClientTools_Resource_Generate_Status"

export function readCVS(filepath: string): any[] {
    let results: any[] = [];
    try {
        console.log(__dirname+'/TFCandidate.csv');
        fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            console.log(results);
        });
    }catch (e) {
        console.log("Failed to read candidate file.");
        console.log(e);
    }
    
    return results;
}

export async function initService(): Promise<any>{
    const credential = new ManagedIdentityCredential();
    const url = process.env["KEYVAULT_URI"] || "https://codegencontrollerkv.vault.azure.net/";

    const client = new SecretClient(url, credential);

    // let secrets = await client.listPropertiesOfSecrets();
    // for (let secret of secrets) {

    // }

    try {
        for await (let secretProperties of client.listPropertiesOfSecrets()) {
            console.log("Secret properties: ", secretProperties);
            console.log(secretProperties.name);
            const secret = await client.getSecret(secretProperties.name);
            process.env[secretProperties.name]=secret.value;
        }

    } catch(e) {
        console.log("Failed to list key secrets");
        console.log(e);
    }
    

    try {
        const secretName = "DepthDBServer";
        const secret = await client.getSecret(secretName);
        process.env[secretName]=secret.value;
    } catch (e) {
        console.log("Failed to get secret");
        console.log(e);
    }
    

}