import { TfCandidateResource } from '../models/entity/depthCoverageSqlServer/entity/tfCandidateResource';
import { CliCandidateOperation } from '../models/entity/depthCoverageSqlServer/entity/cliCandidateOperation';

export interface DepthCoverageDao {
    ingestCandidates(
        candidates: TfCandidateResource[] | CliCandidateOperation[],
        sdk: string
    );
    queryCandidateResources(depthCoverageType: string);
    queryDepthCoverageReport(depthCoverageType: string);
}