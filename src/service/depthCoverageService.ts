import { RepoInfo } from '../models/CodeGenerationModel';
import { CliCandidateOperation } from '../models/entity/depthCoverageSqlServer/entity/cliCandidateOperation';
import { TfCandidateResource } from '../models/entity/depthCoverageSqlServer/entity/tfCandidateResource';

export interface DepthCoverageService {
    ingestCandidates(
        candidates: TfCandidateResource[] | CliCandidateOperation[],
        sdk: string
    );
    triggerOnboard(codegenRepo: RepoInfo, supported: string[]);
}
