export class CandidateResource {
    public constructor(rp: string, rs: string, fileName = 'ALL', apiversion = 'ALL', tag = 'ALL', start = '', end = '') {
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
    public apiVersion = 'ALL';
    public tag = 'ALL';
    public startDate: string;
    public endDate: string;
}
