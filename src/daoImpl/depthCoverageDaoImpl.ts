import { inject, injectable } from 'inversify';
import { Connection } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';

import { DepthCoverageDao } from '../dao/depthCoverageDao';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { DepthCoverageType } from '../models/DepthCoverageModel';
import { SDK } from '../models/common';
import { CliCandidateOperation } from '../models/entity/depthCoverageSqlServer/entity/cliCandidateOperation';
import { CliNotSupportedOperation } from '../models/entity/depthCoverageSqlServer/entity/cliNotSupportedOperation';
import { CliNotSupportedResource } from '../models/entity/depthCoverageSqlServer/entity/cliNotSupportedResource';
import { TfCandidateResource } from '../models/entity/depthCoverageSqlServer/entity/tfCandidateResource';
import { TfNotSupportedOperation } from '../models/entity/depthCoverageSqlServer/entity/tfNotSupportedOperation';
import { TfNotSupportedResource } from '../models/entity/depthCoverageSqlServer/entity/tfNotSupportedResource';

@injectable()
export class DepthCoverageDaoImpl implements DepthCoverageDao {
    private cliCandidateOperationRepository: Repository<CliCandidateOperation>;
    private cliNotSupportedOperationRepository: Repository<CliNotSupportedOperation>;
    private cliNotSupportedResourceRepository: Repository<CliNotSupportedResource>;
    private tfCandidateResourceRepository: Repository<TfCandidateResource>;
    private tfNotSupportedOperationRepository: Repository<TfNotSupportedOperation>;
    private tfNotSupportedResourceRepository: Repository<TfNotSupportedResource>;

    constructor(
        @inject(InjectableTypes.DepthCoverageSqlServerConnection)
        connection: Connection
    ) {
        this.cliCandidateOperationRepository = connection.getRepository(
            CliCandidateOperation
        );
        this.cliNotSupportedOperationRepository = connection.getRepository(
            CliNotSupportedOperation
        );
        this.cliNotSupportedResourceRepository = connection.getRepository(
            CliNotSupportedResource
        );
        this.tfCandidateResourceRepository =
            connection.getRepository(TfCandidateResource);
        this.tfNotSupportedOperationRepository = connection.getRepository(
            TfNotSupportedOperation
        );
        this.tfNotSupportedResourceRepository = connection.getRepository(
            TfNotSupportedResource
        );
    }

    public async ingestCandidates(
        candidates: TfCandidateResource[] | CliCandidateOperation[],
        sdk: string
    ): Promise<void> {
        let repo: Repository<TfCandidateResource | CliCandidateOperation>;

        if (sdk === SDK.TF_SDK) {
            repo = this.tfCandidateResourceRepository;
        } else if (sdk === SDK.CLI_CORE_SDK) {
            repo = this.cliCandidateOperationRepository;
        }

        let preCandidates = await repo.find();
        await repo.remove(preCandidates);
        await repo.save(candidates);
    }

    public async queryCandidateResources(
        depthCoverageType: string
    ): Promise<TfCandidateResource[] | CliCandidateOperation[]> {
        let repo: Repository<TfCandidateResource | CliCandidateOperation>;
        switch (depthCoverageType) {
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE:
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION:
                repo = this.tfCandidateResourceRepository;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE:
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION:
                repo = this.cliCandidateOperationRepository;
                break;
        }
        const candidates = await repo.find();
        return candidates;
    }

    public async queryDepthCoverageReport(
        depthCoverageType: string
    ): Promise<any[]> {
        let repo: Repository<any>;
        switch (depthCoverageType) {
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE:
                repo = this.tfNotSupportedResourceRepository;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION:
                repo = this.tfNotSupportedOperationRepository;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE:
                repo = this.cliNotSupportedResourceRepository;
                break;
            case DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION:
                repo = this.cliNotSupportedOperationRepository;
                break;
            default:
        }
        return repo.find();
    }
}
