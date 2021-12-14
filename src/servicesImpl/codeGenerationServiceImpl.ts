import { CodeGenerationDao } from '../dao/codeGenerationDao';
import { GithubDao } from '../dao/githubDao';
import { TaskResultDao } from '../dao/taskResultDao';
import { injectableTypes } from '../injectableTypes/injectableTypes';
import { CodeGenerationDBColumn, CodeGenerationStatus, RepoInfo } from '../models/CodeGenerationModel';
import { ResourceAndOperation, resourceMapFile } from '../models/ResourceAndOperationModel';
import { TemplateParameters } from '../models/RunAzurePipelineBodyModel';
import { CodeGenerationType, Org, README, Repo, Sdk } from '../models/common';
import { CodeGeneration } from '../models/entity/CodeGeneration';
import { CodegenPipelineTaskResult } from '../models/entity/TaskResult';
import { PipelineVariablesInterface } from '../models/pipelineVariables';
import { CodeGenerationService } from '../service/codeGenerationService';
import { Logger } from '../utils/logger/logger';
import { azurePipelineClient } from '../utils/pipelineClient';
import { inject, injectable } from 'inversify';
import * as yaml from 'node-yaml';
import { Equal, Not } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/naming-convention
const MemoryFileSystem = require('memory-fs');

@injectable()
export class CodeGenerationServiceImpl implements CodeGenerationService {
    @inject(injectableTypes.CodeGenerationDao)
    private codeGenerationDao: CodeGenerationDao;
    @inject(injectableTypes.GithubDao) private githubDao: GithubDao;
    @inject(injectableTypes.TaskResultDao)
    private taskResultDao: TaskResultDao;
    @inject(injectableTypes.Logger) private logger: Logger;

    public async updateCodeGenerationValuesByName(name: string, values: any) {
        await this.codeGenerationDao.updateCodeGenerationValuesByName(name, values);
    }

    public async getCodeGenerationByName(name: string) {
        const codegen = await this.codeGenerationDao.getCodeGenerationByName(name);
        return codegen;
    }

    public async createCodeGeneration(
        name: string,
        resourceProvider: string,
        resources: string,
        sdk: string,
        triggerType: string,
        serviceType: string,
        swaggerRepo: RepoInfo,
        codegenRepo: RepoInfo,
        sdkRepo: RepoInfo,
        commit: string,
        owner: string,
        tag: string,
    ) {
        const readmeFile = `specification/${resourceProvider}/${serviceType}/readme.md`;

        const templateParameters: TemplateParameters = {
            sdkGenerationName: name,
            sdk: sdk,
            resourceProvider: resourceProvider,
            readmeFile: readmeFile,
            triggerType: triggerType,
            specRepoType: swaggerRepo.type,
            specRepoUrl: `${swaggerRepo.path}.git`,
            specRepoBaseBranch: swaggerRepo.branch,
            sdkRepoType: sdkRepo.type,
            sdkRepoUrl: `${sdkRepo.path}.git`,
            sdkRepoBaseBranch: sdkRepo.branch,
            skippedTask: '""',
            serviceType: serviceType,
        };
        const cg: CodeGeneration = new CodeGeneration();
        cg.name = name;
        cg.resourceProvider = resourceProvider;
        cg.serviceType = serviceType;
        cg.resourcesToGenerate = '';
        cg.tag = tag;
        cg.sdk = sdk;
        cg.swaggerRepo = JSON.stringify(swaggerRepo);
        cg.sdkRepo = JSON.stringify(sdkRepo);
        cg.codegenRepo = JSON.stringify(codegenRepo);
        cg.owner = owner === undefined ? '' : owner;
        cg.type = triggerType;
        cg.status = CodeGenerationStatus.CodeGenerationStatusSubmit;
        const response = await azurePipelineClient.runPipeline(templateParameters);
        if (response.status !== 200) {
            throw new Error(`Run pipeline failed for ${name}`);
        }
        cg.lastPipelineBuildID = response.data['id'];
        await this.codeGenerationDao.submitCodeGeneration(cg);
    }

    public async getBranch(repoInfo: RepoInfo, branchName: string) {
        const { org: codegenOrg, repo: codegenRepoName } = this.getGitRepoInfo(repoInfo);
        const result = await this.githubDao.getBranch(codegenOrg, codegenRepoName, branchName);
        return result;
    }

    public getGitRepoInfo(repoInfo: RepoInfo) {
        return this.githubDao.getGitRepoInfo(repoInfo);
    }

    public async deleteSDKCodeGeneration(codegen: CodeGeneration): Promise<any> {
        const resourceProvider = codegen.resourceProvider;
        const sdk = codegen.sdk;
        const type = codegen.type;

        const codegenRepo = codegen.codegenRepo;
        const swaggerRepo = codegen.swaggerRepo;
        const sdkRepo = codegen.sdkRepo;

        const branch = codegen.name;

        /* clear work space. */
        const err = await this.githubDao.clearSDKCodeGenerationWorkSpace(
            resourceProvider,
            sdk,
            type,
            JSON.parse(codegenRepo),
            JSON.parse(sdkRepo),
            JSON.parse(swaggerRepo),
            branch,
        );
        /* delete code generation from table. */
        await this.codeGenerationDao.deleteCodeGenerationByName(codegen.name);

        return err;
    }

    public async getTaskResultByPipelineId(id: string): Promise<CodegenPipelineTaskResult[]> {
        return await this.taskResultDao.getFromBuild(id);
    }

    public async listCodeGenerations(filters: any = undefined, filterCompleted = false): Promise<CodeGeneration[]> {
        return await this.codeGenerationDao.listCodeGenerations(filters, filterCompleted);
    }

    public async completeCodeGeneration(codegen: CodeGeneration): Promise<void> {
        const rp = codegen.resourceProvider;
        const sdk = codegen.sdk;
        const type = codegen.type;

        const codegenRepo = JSON.parse(codegen.codegenRepo);
        const swaggerRepo = JSON.parse(codegen.swaggerRepo);
        const sdkRepo = JSON.parse(codegen.sdkRepo);

        const branch = codegen.name;

        await this.githubDao.clearSDKCodeGenerationWorkSpace(rp, sdk, type, codegenRepo, sdkRepo, swaggerRepo, branch);
        /* update code generation status table. */
        await this.codeGenerationDao.updateCodeGenerationValueByName(
            codegen.name,
            CodeGenerationDBColumn.CodeGenerationColumnStatus,
            CodeGenerationStatus.CodeGenerationStatusCompleted,
        );
    }

    public async cancelCodeGeneration(codegen: CodeGeneration): Promise<any> {
        const resourceProvider = codegen.resourceProvider;
        const sdk = codegen.sdk;
        const type = codegen.type;

        const codegenRepo: RepoInfo = JSON.parse(codegen.codegenRepo);
        const swaggerRepo: RepoInfo = JSON.parse(codegen.swaggerRepo);
        const sdkRepo: RepoInfo = JSON.parse(codegen.sdkRepo);

        const branch = codegen.name;

        await this.githubDao.clearSDKCodeGenerationWorkSpace(resourceProvider, sdk, type, codegenRepo, sdkRepo, swaggerRepo, branch);
        /* update code generation status table. */
        await this.codeGenerationDao.updateCodeGenerationValueByName(
            codegen.name,
            CodeGenerationDBColumn.CodeGenerationColumnStatus,
            CodeGenerationStatus.CodeGenerationStatusCancelled,
        );
    }

    /*customize a code generation. */
    public async runCodeGeneration(codegen: CodeGeneration) {
        const templateParameters: TemplateParameters = {
            sdkGenerationName: codegen.name,
            sdk: codegen.sdk,
            resourceProvider: codegen.resourceProvider,
            readmeFile: `specification/${codegen.resourceProvider}/${codegen.serviceType}/readme.md`,
            triggerType: codegen.type,
            specRepoType: JSON.parse(codegen.swaggerRepo)['type'],
            specRepoUrl: `${JSON.parse(codegen.swaggerRepo)['path']}.git`,
            specRepoBaseBranch: `${JSON.parse(codegen.swaggerRepo)['branch']}`,
            sdkRepoType: JSON.parse(codegen.sdkRepo)['type'],
            sdkRepoUrl: `${JSON.parse(codegen.sdkRepo)['path']}.git`,
            sdkRepoBaseBranch: `${JSON.parse(codegen.sdkRepo)['branch']}`,
            skippedTask: '""',
            serviceType: codegen.serviceType,
        };

        const response = await azurePipelineClient.runPipeline(templateParameters);
        if (response.status !== 200) {
            throw new Error(`Rerun sdk generation ${codegen.name} failed.`);
        }
        await this.codeGenerationDao.updateCodeGenerationValuesByName(codegen.name, {
            lastPipelineBuildID: response.data['id'],
            status: CodeGenerationStatus.CodeGenerationStatusSubmit,
        });
    }

    /**
     *
     * @param rp The resource provider
     * @param sdk The target sdk, terraform, cli or others
     * @param onboardType The onboard type, depth, ad-hoc or others
     * @param triggerPR The code generation pipeline trigger Pull Request
     * @param codePR The pull request for the generated code
     * @param sdkorg The sdk org
     * @param excludeTest indicate if ignore to run mock-test, live-test during this round of customize
     * @returns err if failure
     */
    public async customizeCodeGeneration(name: string, triggerPR: string, codePR: string, excludeTest = false): Promise<any> {
        const codegen = await this.codeGenerationDao.getCodeGenerationByName(name);

        const resourceProvider = codegen.resourceProvider;
        const sdk = codegen.sdk;

        const codeGenRepo = JSON.parse(codegen.codegenRepo);
        const sdkRepo = JSON.parse(codegen.sdkRepo);
        /* generate PR in swagger repo. */
        const branch = name;

        const { org: cgorg, repo: cgreponame } = this.githubDao.getGitRepoInfo(codeGenRepo);

        const jsonMapFile = 'ToGenerate.json';
        const fs = new MemoryFileSystem();
        const filePaths: string[] = [];

        const content = await this.githubDao.readFileFromRepo(
            cgorg !== undefined ? cgorg : Org.Azure,
            cgreponame !== undefined ? cgreponame : Repo.DepthCoverageRepo,
            branch,
            fs,
            jsonMapFile,
        );
        /* exclude test. */
        if (content !== undefined && content.length > 0) {
            const resource: ResourceAndOperation = JSON.parse(content);
            let excludes: string[] = [];
            if (resource.excludeStages !== undefined && resource.excludeStages.length > 0) {
                excludes = resource.excludeStages.split(';');
            }
            let isChanged = false;
            if (excludeTest) {
                if (excludes.indexOf('MockTest') === -1) {
                    isChanged = true;
                    excludes.push('MockTest');
                }
                if (excludes.indexOf('LiveTest') === -1) {
                    isChanged = true;
                    excludes.push('LiveTest');
                }
                resource.excludeStages = excludes.join(';');
            } else {
                const newArray = excludes.filter((item) => item !== 'MockTest' && item !== 'LiveTest');
                if (newArray.length !== excludes.length) {
                    resource.excludeStages = newArray.join(';');
                    isChanged = true;
                }
            }

            if (isChanged) {
                fs.writeFileSync('/' + jsonMapFile, JSON.stringify(resource, null, 2));
                filePaths.push(jsonMapFile);
            }
        }

        let readmeFile = README.CliReadmeFile;
        if (sdk === Sdk.TfSdk) {
            readmeFile = README.TfReadmeFile;
        }

        const tfSchemafile = 'azurerm/internal/services/' + resourceProvider + '/schema.json';
        const tfSchemaDir = 'azurerm/internal/services/' + resourceProvider;
        const { org: sdkOrg, repo: sdkRepoName } = this.githubDao.getGitRepoInfo(sdkRepo);
        const prNumber = codePR.split('/').pop();
        const fileList: string[] = [readmeFile];
        if (sdk === Sdk.TfSdk) {
            fileList.push(tfSchemafile);
            if (!fs.existsSync('/' + tfSchemaDir)) {
                fs.mkdirSync('/' + tfSchemaDir, { recursive: true });
            }
        }
        const readedFiles: string = await this.githubDao.readCustomizeFiles(sdkOrg, sdkRepoName, +prNumber, fs, fileList);

        /* copy configuration to swagger repo */
        const specPath = 'specification/' + resourceProvider + '/resource-manager';
        if (!fs.existsSync('/' + specPath)) {
            fs.mkdirSync('/' + specPath, { recursive: true });
        }
        const swaggerReadMePath = 'specification/' + resourceProvider + '/resource-manager/' + readmeFile;
        fs.copyFile('/' + readmeFile, '/' + swaggerReadMePath, (err) => {
            if (err) {
                this.logger.error('Error Found:', err);
            }
        });

        filePaths.push(swaggerReadMePath);

        if (sdk === Sdk.TfSdk && readedFiles.indexOf(tfSchemafile) !== -1) {
            const schemaPath = 'schema.json';
            const swaggerSchemaPath = 'specification/' + resourceProvider + '/resource-manager/' + schemaPath;
            fs.copyFile('/' + tfSchemafile, '/' + swaggerSchemaPath, (err) => {
                if (err) {
                    console.log('Error Found:', err);
                }
            });
            filePaths.push(swaggerSchemaPath);
        }

        /* update azure-sdk-pipeline trigger pull request. */
        await this.githubDao.uploadToRepo(fs, filePaths, cgorg !== undefined ? cgorg : Org.Azure, cgreponame !== undefined ? cgreponame : Repo.DepthCoverageRepo, branch);

        await this.codeGenerationDao.updateCodeGenerationValuesByName(name, {
            lastPipelineBuildID: '',
            status: CodeGenerationStatus.CodeGenerationStatusCustomizing,
        });

        return undefined;
    }

    /*Onboard, submit generated code to sdk repo, and readme to swagger repo. */
    /**
     *
     * @param rp The resource provider
     * @param sdk The target sdk, terraform, cli or others
     * @param token The github access token
     * @param swaggerorg The swagger org
     * @param sdkorg The sdk org
     * @param onboardtype The onboard type, depth, ad-hoc or others
     * @returns err if failure
     */
    public async submitGeneratedCode(codegen: CodeGeneration): Promise<void> {
        const rp = codegen.resourceProvider;
        const type = codegen.type;

        const swaggerRepo = JSON.parse(codegen.swaggerRepo);
        const sdkRepo = JSON.parse(codegen.sdkRepo);

        /* generate PR in swagger repo. */
        const branch = codegen.name;

        const { org: swaggerOrg, repo: swaggerRepoName } = this.githubDao.getGitRepoInfo(swaggerRepo);
        const swaggerPR = await this.githubDao.createPullRequest(
            swaggerOrg !== undefined ? swaggerOrg : Org.Azure,
            swaggerRepoName !== undefined ? swaggerRepoName : Repo.SwaggerRepo,
            swaggerRepo.branch,
            branch,
            '[' + type + ', ' + rp + ']pull request from pipeline ' + branch,
        );

        /* generate PR in sdk code repo. */

        const { org: sdkOrg, repo: sdkRepoName } = this.githubDao.getGitRepoInfo(sdkRepo);
        const codePR = await this.githubDao.createPullRequest(sdkOrg, sdkRepoName, sdkRepo.branch, branch, '[' + type + ', ' + rp + ']pull request from pipeline ' + branch);

        /* close work sdk branch. */
        const workBranch = codegen.name + '-code';
        await this.githubDao.deleteBranch(sdkOrg, sdkRepoName, workBranch);

        /* update the code generation status. */
        const values = {
            swaggerPR: swaggerPR,
            codePR: codePR,
            status: CodeGenerationStatus.CodeGenerationStatusCompleted,
        };
        await this.codeGenerationDao.updateCodeGenerationValuesByName(codegen.name, values);
    }

    public async publishTaskResult(pipelineBuildId: string, taskResult: CodegenPipelineTaskResult) {
        await this.taskResultDao.put(pipelineBuildId, taskResult);
    }

    /**
     * Generate pull request for the generated code
     * @param token The github access token
     * @param org The org of the repo to submit code to
     * @param repo The repository to submit code to
     * @param title The pull request title
     * @param branch The head branch of the pull request
     * @param basebranch The base branch of the pull request
     * @returns
     */
    public async generateCodePullRequest(org: string, repo: string, title: string, branch: string, basebranch: string): Promise<string> {
        let prlink: string;
        const pulls: string[] = await this.githubDao.listOpenPullRequest(org, repo, branch, basebranch);
        if (pulls.length > 0) {
            prlink = pulls[0];
        } else {
            prlink = await this.githubDao.submitPullRequest(org, repo, title, branch, basebranch);
        }

        return prlink;
    }

    public async completeAllCodeGenerations() {
        /* Get all code generations which under pipeline completed status. */
        const codegens: CodeGeneration[] = await this.codeGenerationDao.listCodeGenerationsByStatus(CodeGenerationStatus.CodeGenerationStatusPipelineCompleted);
        for (const codegen of codegens) {
            const codepr = codegen.codePR;
            if (codepr !== undefined && codepr.length > 0) {
                const isMerged: boolean = await this.githubDao.isMergedPullRequest(codepr);
                if (!isMerged) {
                    continue;
                }
            }

            const swaggerpr = codegen.swaggerPR;
            if (swaggerpr !== undefined && swaggerpr.length > 0) {
                const isMerged: boolean = await this.githubDao.isMergedPullRequest(swaggerpr);
                if (!isMerged) {
                    continue;
                }
            }
            /* pr is merged. complete the code generation. */

            const err = this.completeCodeGeneration(codegen);
            if (err !== undefined) {
                console.log('Failed to complete code generation ' + codegen.toString());
            } else {
                console.log('Code generation ' + codegen.toString() + ' is completed.');
            }
        }
    }

    public async createCodeGenerationByCreatingPR(name: string, codegenOrg: string, codegenRepo: string, codegenBaseBranch: string, rpToGen: ResourceAndOperation, owner?: string) {
        const branchName = name;
        const baseCommit = await this.githubDao.getCurrentCommit(codegenOrg, codegenRepo, codegenBaseBranch);

        await this.githubDao.createBranch(codegenOrg, codegenRepo, branchName, baseCommit.commitSha);

        const fs = new MemoryFileSystem();

        fs.writeFileSync('/' + resourceMapFile, JSON.stringify(rpToGen, null, 2));

        /* generate variable yml file */
        const st: string[] = this.collectPipelineStages(rpToGen.onboardType, rpToGen.target);
        let sdk: string = rpToGen.target;
        /* wrapped clicore and cliextension to cli. */
        if (sdk === Sdk.CliCoreSdk || sdk === Sdk.CliExtensionSdk) {
            sdk = Sdk.CLI;
        }
        const { org: swaggerOrg, repo: swaggerRepoName } = this.githubDao.getGitRepoInfo(rpToGen.swaggerRepo);

        const { org: sdkOrg, repo: sdkRepoName } = this.githubDao.getGitRepoInfo(rpToGen.sdkRepo);

        /*Get readme github url with commit. */
        let readmeCommit = rpToGen.commit;
        if (readmeCommit === undefined || readmeCommit.length === 0) {
            const curCommit = await this.githubDao.getCurrentCommit(swaggerOrg, swaggerRepoName, rpToGen.swaggerRepo.branch);
            readmeCommit = curCommit.commitSha;
        }
        const readmeurl: string = this.githubDao.getBlobURL(readmeCommit, rpToGen.RPName, rpToGen.swaggerRepo);
        const v: PipelineVariablesInterface = {
            variables: {
                CodeGenerationName: name,
                SDK: sdk,
                SERVICE_TYPE: rpToGen.serviceType,
                stages: st.join(';'),
                SPEC_REPO_TYPE: rpToGen.swaggerRepo.type,
                SPEC_REPO_URL: rpToGen.swaggerRepo.path.replace('https://', '').replace('http://', ''),
                SPEC_REPO_BASE_BRANCH: rpToGen.swaggerRepo.branch,
                SPEC_REPO_OWNER: swaggerOrg,
                SPEC_REPO_NAME: swaggerRepoName,
                SDK_REPO_TYPE: rpToGen.sdkRepo.type,
                SDK_REPO_URL: rpToGen.sdkRepo.path.replace('https://', '').replace('http://', ''),
                SDK_REPO_BASE_BRANCH: rpToGen.sdkRepo.branch,
                SDK_REPO_OWNER: sdkOrg,
                SDK_REPO_NAME: sdkRepoName,
                README_FILE_GITHUB_URL_WITH_COMMIT: readmeurl,
                CHECK_OUT: rpToGen.onboardType === CodeGenerationType.Release,
            },
        };
        fs.writeFileSync('/' + 'Variables.yml', yaml.dump(v));

        await this.githubDao.uploadToRepo(fs, ['ToGenerate.json', 'Variables.yml'], codegenOrg, codegenRepo, branchName);
        /* create pull request. */
        await this.githubDao.createPullRequest(codegenOrg, codegenRepo, codegenBaseBranch, branchName, 'pull request from branch ' + branchName);

        const cg: CodeGeneration = new CodeGeneration();
        cg.name = name;
        cg.resourceProvider = rpToGen.RPName;
        cg.serviceType = rpToGen.serviceType;
        cg.resourcesToGenerate = rpToGen.resourcelist;
        cg.tag = rpToGen.tag;
        cg.sdk = rpToGen.target;
        cg.swaggerRepo = JSON.stringify(rpToGen.swaggerRepo);
        cg.sdkRepo = JSON.stringify(rpToGen.sdkRepo);
        cg.codegenRepo = JSON.stringify(rpToGen.codegenRepo);
        cg.owner = owner === undefined ? '' : owner;
        cg.type = rpToGen.onboardType;
        cg.status = CodeGenerationStatus.CodeGenerationStatusSubmit;

        await this.codeGenerationDao.submitCodeGeneration(cg);
    }

    public async runCodeGenerationForCI() {
        const codeGens: CodeGeneration[] = await this.codeGenerationDao.listCodeGenerations({
            type: CodeGenerationType.Ci,
            status: Not(Equal(CodeGenerationStatus.CodeGenerationStatusInProgress)),
        });
        for (const codeGen of codeGens) {
            try {
                this.runCodeGeneration(codeGen);
            } catch (e) {
                this.logger.info(`Failed to re-run Code generation ${codeGen.name} (resourceProvider: ${codeGen.resourceProvider}, sdk: ${codeGen.sdk}, type: ${codeGen.type})`);
                this.logger.error(e);
            }
            this.logger.info(`Code generation ${codeGen.name} (resourceProvider: ${codeGen.resourceProvider}, sdk: ${codeGen.sdk}, type: ${codeGen.type}) is triggered`);
        }
    }

    private collectPipelineStages(type: string, sdk: string): string[] {
        const stages: string[] = [];
        stages.push('Setup');
        stages.push('GenerateCode');
        if (this.needBuild(sdk)) {
            stages.push('Build');
        }
        stages.push('MockTest');
        stages.push('LiveTest');
        if (type === CodeGenerationType.DepthCoverage || type === CodeGenerationType.Release) {
            stages.push('Submit');
        }

        return stages;
    }

    private needBuild(sdk: string): boolean {
        if (sdk === Sdk.TfSdk || sdk === Sdk.DotNetSdk || sdk === Sdk.GoSdk) {
            return true;
        } else {
            return false;
        }
    }
}
