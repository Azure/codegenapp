import { OnboardType } from "./common";

export const RESOUCEMAPFile = "ToGenerate.json";

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