import { config } from '../config';
import { RepoInfo } from './CodeGenerationModel';
import { CodeGenerationType } from './common';

export const resourceMapFile = 'ToGenerate.json';

export enum ServiceType {
    ResourceManager = 'resource-manager',
    DataPlane = 'data-plan',
}

export interface JsonOperationMap {
    jsonfile: string;
    ops: string;
}

export class ResourceAndOperation {
    public constructor(
        rpName: string,
        readme: string,
        resources: OnboardResource[],
        target: string,
        type: string = CodeGenerationType.DepthCoverage,
        stype?: string,
        swagger?: RepoInfo,
        codegenRepo?: RepoInfo,
        sdkRepo?: RepoInfo,
        commit?: string,
    ) {
        this.RPName = rpName;
        this.readmeFile = readme;
        this.resources = resources;
        this.target = target;
        this.onboardType = type;
        if (stype !== undefined) {
            this.serviceType = stype;
        }

        if (swagger !== undefined) {
            this.swaggerRepo = swagger;
        }

        if (codegenRepo !== undefined) {
            this.codegenRepo = codegenRepo;
        }

        if (sdkRepo !== undefined) {
            this.sdkRepo = sdkRepo;
        } else {
            this.sdkRepo = config.defaultSDKRepos[target];
        }
        this.commit = commit;
    }
    public name: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public RPName: string;
    public serviceType: string = ServiceType.ResourceManager;
    public readmeFile: string;
    public target: string;
    public resources: OnboardResource[] = [];
    public excludeStages: string;
    public tag: string;
    public resourcelist = '';
    public onboardType: string = CodeGenerationType.DepthCoverage;
    public swaggerRepo: RepoInfo = config.defaultSwaggerRepo;
    public sdkRepo: RepoInfo = undefined;
    public codegenRepo: RepoInfo = config.defaultCodegenRepo;
    public commit: string = undefined; // the commit id.

    public jsonFileList: JsonOperationMap[] = [];

    public generateResourceList() {
        for (const r of this.resources) {
            if (this.resourcelist.length === 0) {
                this.resourcelist = r.Resource;
            } else {
                this.resourcelist = this.resourcelist + ',' + r.Resource;
            }
        }
    }
}

export class OnboardResource {
    public constructor(rs: string, version: string) {
        this.Resource = rs;
        this.APIVersion = version;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public Resource: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public APIVersion: string = undefined;
    public operations: OnboardOperation[] = [];
    public tag: string;
}
export class OnboardOperation {
    public constructor(id: string, version: string, jsonfile: string) {
        this.OperationId = id;
        this.version = version;
        this.jsonFilePath = jsonfile;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public OperationId: string;
    public version: string;
    public jsonFilePath: string;
}
