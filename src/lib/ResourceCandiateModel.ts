export class CandidateResource {
  public constructor(
    rp: string,
    rs: string,
    fileName: string = "ALL",
    apiversion: string = "ALL",
    tag: string = "ALL",
    start: string = "",
    end: string = ""
  ) {
    this.resourceProvider = rp;
    this.fullResourceType = rs;
    this.fileName = fileName;
    this.apiVersion = apiversion;
    this.tag = tag;
    this.startDate = start;
    this.endDate = end;
  }
  public resourceProvider: string;
  public fullResourceType: string;
  public fileName: string;
  public apiVersion: string = "ALL";
  public tag: string = "ALL";
  public startDate: string;
  public endDate: string;
}

export enum CandidateTable {
  CLI_CANDIDATE_RESOURCE_TABLE = "AMEClientTools_Coverage_CLICandidateOperations",
  TF_CANDIDATE_RESOURCE_TABLE = "AMEClientTools_Coverage_TFCandidateResources",
}
export const CodegenStatusTable = "AMEClientTools_Resource_Generate_Status";

export const sdkCodegenTable = "AMEClientTools_SDK_Code_Generation";
