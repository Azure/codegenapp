import { inject, injectable } from 'inversify';

import { CodeGenerationDao } from '../dao/codeGenerationDao';
import { DepthCoverageDao } from '../dao/depthCoverageDao';
import { GithubDao } from '../dao/githubDao';
import { DepthCoverageDaoImpl } from '../daoImpl/depthCoverageDaoImpl';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { CodeGenerationStatus, RepoInfo } from '../models/CodeGenerationModel';
import {
    DepthCoverageType,
    Operation,
    Resource,
} from '../models/DepthCoverageModel';
import {
    JsonOperationMap,
    OnboardOperation,
    OnboardResource,
    ResourceAndOperation,
} from '../models/ResourceAndOperationModel';
import { CandidateResource } from '../models/ResourceCandiateModel';
import { SDK } from '../models/common';
import { CodeGeneration } from '../models/entity/codegenSqlServer/entity/CodeGeneration';
import { CliCandidateOperation } from '../models/entity/depthCoverageSqlServer/entity/cliCandidateOperation';
import { TfCandidateResource } from '../models/entity/depthCoverageSqlServer/entity/tfCandidateResource';
import { CodeGenerationService } from '../service/codeGenerationService';
import { DepthCoverageService } from '../service/depthCoverageService';
import { Logger } from '../utils/logger/logger';

@injectable()
export class DepthCoverageServiceImpl implements DepthCoverageService {
    @inject(InjectableTypes.DepthCoverageDao)
    private depthCoverageDao: DepthCoverageDao;
    @inject(InjectableTypes.GithubDao)
    private githubDao: GithubDao;
    @inject(InjectableTypes.CodeGenerationDao)
    private codeGenerationDao: CodeGenerationDao;
    @inject(InjectableTypes.CodeGenerationService)
    private codeGenerationService: CodeGenerationService;
    @inject(InjectableTypes.Logger)
    private logger: Logger;

    public async retrieveResourceToGenerate(
        depthCoverageType: string,
        supportedResources: CandidateResource[] = undefined
    ): Promise<ResourceAndOperation[]> {
        const opOrResources: any[] =
            await this.depthCoverageDao.queryDepthCoverageReport(
                depthCoverageType
            );
        /*TODO: get the supported service from db. */

        let sdk = '';
        if (
            depthCoverageType ===
                DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
            depthCoverageType ===
                DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPOT_RESOURCE
        ) {
            sdk = SDK.CLI_CORE_SDK;
        } else {
            sdk = SDK.TF_SDK;
        }
        if (
            depthCoverageType ===
                DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION ||
            depthCoverageType ===
                DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_OPERATION
        ) {
            const res: ResourceAndOperation[] =
                await this.convertOperationToDepthCoverageResourceAndOperation(
                    opOrResources,
                    sdk,
                    supportedResources
                );

            return res;
        } else {
            const res: ResourceAndOperation[] =
                await this.convertResourceToDepthCoverageResourceAndOperation(
                    opOrResources,
                    sdk,
                    supportedResources
                );

            return res;
        }
    }

    public isCandidateResource(
        candidates: CandidateResource[],
        resourceProvider: string,
        fullResourceType: string
    ): boolean {
        for (let candidate of candidates) {
            if (
                candidate.resourceProvider === resourceProvider &&
                (candidate.fullResourceType.toLowerCase() === 'all' ||
                    candidate.fullResourceType === fullResourceType)
            )
                return true;
        }

        return false;
    }

    public getCandidateResource(
        candidates: CandidateResource[],
        resourceProvider: string,
        fullResourceType: string
    ): CandidateResource {
        if (candidates === undefined) return undefined;
        for (let candidate of candidates) {
            if (
                candidate.resourceProvider === resourceProvider &&
                (candidate.fullResourceType.toLowerCase() === 'all' ||
                    candidate.fullResourceType === fullResourceType)
            )
                return candidate;
        }

        return undefined;
    }

    public async convertOperationToDepthCoverageResourceAndOperation(
        ops: Operation[],
        sdk: string,
        supportedResource: CandidateResource[] = undefined
    ): Promise<ResourceAndOperation[]> {
        let result: ResourceAndOperation[] = [];
        const specFileRegex =
            '(specification/)+(.*)/(resourcemanager|resource-manager|dataplane|data-plane|control-plane)/(.*)/(preview|stable|privatepreview)/(.*?)/(example)?(.*)';
        for (let op of ops) {
            let m = op.fileName.match(specFileRegex);
            if (!m) {
                this.logger.warn(
                    `Fail to parse swagger file json ${op.fileName}`
                );
                continue;
            }

            let serviceName = m['serviceName'];
            let apiVersion = m['apiVersion'];
            if (
                supportedResource !== undefined &&
                !this.isCandidateResource(
                    supportedResource,
                    serviceName,
                    op.fullResourceType
                )
            )
                continue;
            /* use api-version in candidate. */
            let candidate = this.getCandidateResource(
                supportedResource,
                serviceName,
                op.fullResourceType
            );
            if (
                candidate !== undefined &&
                candidate.apiVersion.toLowerCase() != 'all'
            ) {
                apiVersion = candidate.apiVersion;
            }

            /*use tag in candidate. */
            let tag: string = undefined;
            if (
                candidate != undefined &&
                candidate.tag !== undefined &&
                candidate.tag !== null &&
                candidate.tag.toLowerCase() != 'all'
            ) {
                tag = candidate.tag;
            }
            let rp = this.getResourceProvide(result, serviceName);
            if (rp === undefined) {
                let readme =
                    op.fileName.split('/').slice(0, 4).join('/') + '/readme.md';
                rp = new ResourceAndOperation(serviceName, readme, [], sdk);
                result.push(rp);
            }
            if (tag !== undefined) {
                if (rp.tag === undefined) {
                    rp.tag = tag;
                } else if (rp.tag.indexOf(tag) === -1) {
                    rp.tag = rp.tag + ';' + tag;
                }
            }
            let rs = this.getResource(rp.resources, op.fullResourceType);
            if (rs !== undefined) {
                let find = this.getOperation(rs.operations, op.operationId);
                if (find === undefined) {
                    rs.operations.push(
                        new OnboardOperation(
                            op.operationId,
                            apiVersion,
                            op.fileName
                        )
                    );
                }
            } else {
                rs = new OnboardResource(op.fullResourceType, apiVersion);
                rs.operations.push(
                    new OnboardOperation(
                        op.operationId,
                        apiVersion,
                        op.fileName
                    )
                );
                rp.resources.push(rs);
            }
            if (tag !== undefined) rs.tag = tag;

            let joMap: JsonOperationMap = this.getJsonFileOperationMap(
                rp.jsonFileList,
                op.fileName
            );
            if (joMap === undefined) {
                joMap = {
                    jsonfile: op.fileName,
                    ops: op.operationId,
                };
                rp.jsonFileList.push(joMap);
            } else {
                let ops = joMap.ops;
                if (ops === undefined || ops.length === 0) {
                    ops = op.operationId;
                } else {
                    ops = ops + ',' + op.operationId;
                }

                joMap.ops = ops;
            }
        }

        return result;
    }

    public async convertResourceToDepthCoverageResourceAndOperation(
        resourcelist: Resource[],
        sdk: string,
        supportedResource: CandidateResource[] = undefined
    ): Promise<ResourceAndOperation[]> {
        let result: ResourceAndOperation[] = [];
        const specFileRegex =
            '(specification/)+(.*)/(resourcemanager|resource-manager|dataplane|data-plane|control-plane)/(.*)/(preview|stable|privatepreview)/(.*?)/(example)?(.*)';
        for (let crs of resourcelist) {
            let m = crs.fileName.match(specFileRegex);
            if (!m) {
                console.warn(
                    `\tFail to parse swagger file json ${crs.fileName}`
                );
                continue;
            }

            let serviceName = m['serviceName'];
            let apiVersion = m['apiVersion'];
            if (
                supportedResource !== undefined &&
                !this.isCandidateResource(
                    supportedResource,
                    serviceName,
                    crs.fullResourceType
                )
            )
                continue;
            let candidate = this.getCandidateResource(
                supportedResource,
                serviceName,
                crs.fullResourceType
            );
            /*use tag in candidate. */
            let tag: string = undefined;
            if (
                candidate !== undefined &&
                candidate.tag !== undefined &&
                candidate.tag !== null &&
                candidate.tag.toLowerCase() != 'all'
            ) {
                tag = candidate.tag;
            }
            let rp = this.getResourceProvide(result, serviceName);
            if (rp === undefined) {
                let readme =
                    crs.fileName.split('/').slice(0, 4).join('/') +
                    '/readme.md';
                rp = new ResourceAndOperation(serviceName, readme, [], sdk);
                result.push(rp);
            }
            if (tag !== undefined) {
                if (rp.tag === undefined) {
                    rp.tag = tag;
                } else if (rp.tag.indexOf(tag) === -1) {
                    rp.tag = rp.tag + ';' + tag;
                }
            }
            let rs = this.getResource(rp.resources, crs.fullResourceType);
            if (rs === undefined) {
                rs = new OnboardResource(crs.fullResourceType, apiVersion);
                rp.resources.push(rs);

                let joMap: JsonOperationMap = this.getJsonFileOperationMap(
                    rp.jsonFileList,
                    crs.fileName
                );
                if (joMap === undefined) {
                    joMap = {
                        jsonfile: crs.fileName,
                        ops: '',
                    };
                    rp.jsonFileList.push(joMap);
                }
            }
            if (tag !== undefined) rs.tag = tag;
        }

        return result;
    }

    public async triggerOnboard(
        codegenRepo: RepoInfo,
        supported: string[] = undefined
    ): Promise<any> {
        let tfSupportedResource: CandidateResource[] = undefined;
        const tfCandidates =
            await this.depthCoverageDao.queryCandidateResources(
                DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE
            );
        if (
            tfCandidates.length > 0 ||
            (supported !== undefined && supported.length > 0)
        ) {
            tfSupportedResource = [];
            for (let candidate of tfCandidates) {
                tfSupportedResource.push(candidate);
            }

            if (supported !== undefined) {
                for (let s of supported) {
                    const candidate = new CandidateResource(s, 'ALL');
                    tfSupportedResource.push(candidate);
                }
            }
        }
        const tfResources = await this.retrieveResourceToGenerate(
            DepthCoverageType.DEPTH_COVERAGE_TYPE_TF_NOT_SUPPORT_RESOURCE,
            tfSupportedResource
        );

        let cliSupportedResource: CandidateResource[] = undefined;
        const cliCandidates =
            await this.depthCoverageDao.queryCandidateResources(
                DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION
            );
        if (
            cliCandidates.length > 0 ||
            (supported !== undefined && supported.length > 0)
        ) {
            cliSupportedResource = [];
            for (let candidate of cliCandidates) {
                cliSupportedResource.push(candidate);
            }

            if (supported !== undefined) {
                for (let s of supported) {
                    const candidate = new CandidateResource(s, 'ALL');
                    cliSupportedResource.push(candidate);
                }
            }
        }

        const cliResources = await this.retrieveResourceToGenerate(
            DepthCoverageType.DEPTH_COVERAGE_TYPE_CLI_NOT_SUPPORT_OPERATION,
            cliSupportedResource
        );

        let resources = tfResources.concat(cliResources);

        for (let rs of resources) {
            try {
                rs.generateResourceList();
                const name: string =
                    rs.onboardType +
                    '-' +
                    rs.target.toLowerCase() +
                    '-' +
                    rs.RPName;
                let codegen: CodeGeneration =
                    await this.codeGenerationDao.getCodeGenerationByName(name);

                if (
                    codegen !== undefined &&
                    codegen.status !=
                        CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED &&
                    codegen.status !=
                        CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
                ) {
                    this.logger.info(
                        'The code generation pipeline(' +
                            rs.RPName +
                            ',' +
                            rs.target +
                            ') is under ' +
                            codegen.status +
                            ' Already. Ignore this trigger.'
                    );
                } else {
                    const { org: codegenOrg, repo: codegenRepoName } =
                        this.githubDao.getGitRepoInfo(codegenRepo);
                    const baseBranch = codegenRepo.branch;
                    await this.codeGenerationService.createCodeGenerationByCreatingPR(
                        codegen.name,
                        codegenOrg,
                        codegenRepoName,
                        baseBranch,
                        rs
                    );
                }
            } catch (err) {
                this.logger.error(err);
                return err;
            }
        }

        return undefined;
    }

    public getJsonFileOperationMap(
        list: JsonOperationMap[],
        target: string
    ): JsonOperationMap {
        for (let m of list) {
            if (m.jsonfile === target) return m;
        }

        return undefined;
    }

    public getResourceProvide(resources: ResourceAndOperation[], rp: string) {
        for (let r of resources) {
            if (r.RPName === rp) return r;
        }

        return undefined;
    }

    public getResource(
        resources: OnboardResource[],
        resource: string
    ): OnboardResource {
        for (let r of resources) {
            if (r.Resource === resource) return r;
        }
        return undefined;
    }

    public getOperation(operations: OnboardOperation[], id: string) {
        for (let op of operations) {
            if (op.OperationId === id) return op;
        }
        return undefined;
    }

    public async ingestCandidates(
        candidates: TfCandidateResource[] | CliCandidateOperation[],
        sdk: string
    ) {
        return await this.depthCoverageDao.ingestCandidates(candidates, sdk);
    }
}
