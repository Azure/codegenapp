import { TfCandidateResource } from '../models/entity/depthCoverageSqlServer/entity/tfCandidateResource';
import { CliCandidateOperation } from '../models/entity/depthCoverageSqlServer/entity/cliCandidateOperation';
import { RepoInfo } from '../models/CodeGenerationModel';

export interface DepthCoverageService {
    ingestCandidates(
        candidates: TfCandidateResource[] | CliCandidateOperation[],
        sdk: string
    );
    triggerOnboard(token: string, codegenRepo: RepoInfo, supported: string[]);
}
