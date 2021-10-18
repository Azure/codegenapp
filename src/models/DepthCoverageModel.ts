/* the operation schema in depth coverage db. */
export class Operation {
    public constructor(
        path: string,
        resouceName: string,
        name: string,
        id: string,
        filename: string
    ) {
        this.path = path;
        this.fullResourceType = resouceName;
        this.operationName = name;
        this.operationId = id;
        this.fileName = filename;
    }
    public path: string = undefined;
    public fullResourceType: string = undefined;
    public operationName: string = undefined;
    public operationId: string = undefined;
    public fileName: string = undefined;
}

/* the resource schema in depth coverage db. */
export class Resource {
    public constructor(resource: string, filename: string) {
        this.fullResourceType = resource;
        this.fileName = filename;
    }
    public fullResourceType: string = undefined;
    public fileName: string = undefined;
}

export enum DepthCoverageType {
    DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE = 'TF_NOT_SUPPORT_RESOURCE',
    DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION = 'TF_NOT_SUPPORT_OPERATION',
    DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION = 'CLI_NOT_SUPPORT_OPERATION',
    DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE = 'CLI_NOT_SUPPOT_RESOURCE',
}
