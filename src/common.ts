import fs = require('fs');
import csv = require('csv-parser');

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
      SQLSTR_INSERT_CANDIDATE = "INSERT INTO %s (resourceProvider, fullResourceType, fileName, apiVersion, tag, startDate, endDate) values (@resourceProvider, @fullResourceType, @fileName, @apiVersion, @tag, @startDate, @endDate)",
      SQLSTR_CLEAR_CANDIDATE = "DElETE from %s",
      SQLSTR_DELETE = "DELETE from %s where resourceProvider='%s' and fullResourceType='%s'"
}

export enum OnboardType {
    DEPTH_COVERAGE = "depth",
    ADHOC_ONBOARD = "onboard"
}

export enum CandidateTable {
    CLI_CANDIDATE_RESOURCE_TABLE="AMEClientTools_Coverage_CLICandidateOperations",
    TF_CANDIDATE_RESOURCE_TABLE="AMEClientTools_Coverage_TFCandidateResources"
}

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