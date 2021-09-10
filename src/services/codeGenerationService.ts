import { inject, injectable } from 'inversify';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { CodeGenerationDao } from '../dao/codeGenerationDao';
import {
    CodeGenerationDBColumn,
    CodeGenerationStatus,
    RepoInfo,
} from '../models/CodeGenerationModel';
import {
    RESOUCEMAPFile,
    ResourceAndOperation,
} from '../models/ResourceAndOperationModel';
import * as yaml from 'node-yaml';

import { CodeGenerationType, ORG, README, REPO, SDK } from '../models/common';
import { PipelineVariablesInterface } from '../models/pipelineVariables';
import { CodeGeneration } from '../models/entity/codegenSqlServer/entity/CodeGeneration';
import { GithubDao } from '../dao/githubDao';
import { TaskResultDao } from '../dao/taskResultDao';
import {
    CodegenPipelineTaskResult,
    TaskResult,
} from '../models/entity/taskResultMongodb/entity/TaskResult';
import { Logger } from '../utils/logger/Logger';
import * as path from 'path';
const MemoryFileSystem = require('memory-fs');

@injectable()
export class CodeGenerationService {
    @inject(InjectableTypes.CodeGenerationDao)
    private codeGenerationDao: CodeGenerationDao;
    @inject(InjectableTypes.GithubDao) private githubDao: GithubDao;
    @inject(InjectableTypes.TaskResultDao) private taskResultDao: TaskResultDao;
    @inject(InjectableTypes.Logger) private logger: Logger;

    public async updateCodeGenerationValuesByName(name: string, values: any) {
        await this.codeGenerationDao.updateCodeGenerationValuesByName(
            name,
            values
        );
    }

    public async getCodeGenerationByName(name: string) {
        let codegen = await this.codeGenerationDao.getCodeGenerationByName(
            name
        );
        return codegen;
    }

    public async createCodeGeneration(
        name: string,
        resourceProvider: string,
        resources: string,
        sdk: string,
        type: string,
        serviceType: string,
        swaggerRepo: RepoInfo,
        codegenRepo: RepoInfo,
        sdkRepo: RepoInfo,
        tag: string
    ) {
        let readmefile: string =
            '/specification/' +
            resourceProvider +
            '/resource-manager/readme.md';
        let rs: ResourceAndOperation = new ResourceAndOperation(
            resourceProvider,
            readmefile,
            [],
            sdk,
            type,
            serviceType,
            swaggerRepo,
            codegenRepo,
            sdkRepo
        );
        if (tag !== undefined) rs.tag = tag;
        rs.generateResourceList();
        if (resources !== undefined) rs.resourcelist = resources;

        const {
            org: codegenOrg,
            repo: codegenRepoName,
        } = this.githubDao.getGitRepoInfo(codegenRepo);
        await this.createCodeGenerationByCreatingPR(
            name,
            codegenOrg,
            codegenRepoName,
            codegenRepo.branch,
            rs
        );
    }

    public async deleteSDKCodeGeneration(
        codegen: CodeGeneration
    ): Promise<any> {
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
            branch
        );
        /* delete code generation from table. */
        await this.codeGenerationDao.deleteCodeGenerationByName(codegen.name);

        return err;
    }

    public async getTaskResultByPipelineId(id: string): Promise<TaskResult[]> {
        return await this.taskResultDao.getFromBuild(id);
    }

    public async listCodeGenerations(
        filters: {} = undefined,
        filterCompleted: boolean = false
    ): Promise<CodeGeneration[]> {
        return await this.codeGenerationDao.listCodeGenerations(
            filters,
            filterCompleted
        );
    }

    public async completeCodeGeneration(
        codegen: CodeGeneration
    ): Promise<void> {
        const rp = codegen.resourceProvider;
        const sdk = codegen.sdk;
        const type = codegen.type;

        const codegenrepo = JSON.parse(codegen.codegenRepo);
        const swagger_repo = JSON.parse(codegen.swaggerRepo);
        const sdk_repo = JSON.parse(codegen.sdkRepo);

        const branch = codegen.name;

        await this.githubDao.clearSDKCodeGenerationWorkSpace(
            rp,
            sdk,
            type,
            codegenrepo,
            sdk_repo,
            swagger_repo,
            branch
        );
        /* update code generation status table. */
        await this.codeGenerationDao.updateCodeGenerationValueByName(
            codegen.name,
            CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
            CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED
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

        await this.githubDao.clearSDKCodeGenerationWorkSpace(
            resourceProvider,
            sdk,
            type,
            codegenRepo,
            sdkRepo,
            swaggerRepo,
            branch
        );
        /* update code generation status table. */
        await this.codeGenerationDao.updateCodeGenerationValueByName(
            codegen.name,
            CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
            CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED
        );
    }

    /*customize a code generation. */
    public async runCodeGeneration(codegen: CodeGeneration) {
        const codegenrepo = JSON.parse(codegen.codegenRepo);

        /* generate PR in swagger repo. */
        let branch = codegen.name;

        const { org: cgorg, repo: cgreponame } = this.githubDao.getGitRepoInfo(
            codegenrepo
        );
        const fs = new MemoryFileSystem();
        const jsonMapFile: string = 'ToGenerate.json';
        let filepaths: string[] = [];
        let content = await this.githubDao.readFileFromRepo(
            cgorg !== undefined ? cgorg : ORG.AZURE,
            cgreponame !== undefined ? cgreponame : REPO.DEPTH_COVERAGE_REPO,
            branch,
            fs,
            jsonMapFile
        );

        if (content !== undefined && content.length > 0) {
            let resource: ResourceAndOperation = JSON.parse(content);
            fs.writeFileSync(
                '/' + jsonMapFile,
                JSON.stringify(resource, null, 2)
            );
            filepaths.push(jsonMapFile);
        }

        /* update depth-coverage-pipeline trigger pull request. */
        await this.githubDao.uploadToRepo(
            fs,
            filepaths,
            cgorg !== undefined ? cgorg : ORG.AZURE,
            cgreponame !== undefined ? cgreponame : REPO.DEPTH_COVERAGE_REPO,
            branch
        );
        await this.codeGenerationDao.updateCodeGenerationValueByName(
            codegen.name,
            CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
            CodeGenerationStatus.CODE_GENERATION_STATUS_SUBMIT
        );
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
    public async customizeCodeGeneration(
        name: string,
        triggerPR: string,
        codePR: string,
        excludeTest: boolean = false
    ): Promise<any> {
        let customizer: any = undefined;

        let codegen = await this.codeGenerationDao.getCodeGenerationByName(
            name
        );

        const resourceProvider = codegen.resourceProvider;
        const sdk = codegen.sdk;

        const codegenrepo = JSON.parse(codegen.codegenRepo);
        const sdkrepo = JSON.parse(codegen.sdkRepo);
        /* generate PR in swagger repo. */
        let branch = name;

        const { org: cgorg, repo: cgreponame } = this.githubDao.getGitRepoInfo(
            codegenrepo
        );

        const jsonMapFile: string = 'ToGenerate.json';
        const fs = new MemoryFileSystem();
        let filepaths: string[] = [];

        let content = await this.githubDao.readFileFromRepo(
            cgorg !== undefined ? cgorg : ORG.AZURE,
            cgreponame !== undefined ? cgreponame : REPO.DEPTH_COVERAGE_REPO,
            branch,
            fs,
            jsonMapFile
        );
        /* exclude test. */
        if (content !== undefined && content.length > 0) {
            let resource: ResourceAndOperation = JSON.parse(content);
            let excludes: string[] = [];
            if (
                resource.excludeStages !== undefined &&
                resource.excludeStages.length > 0
            )
                excludes = resource.excludeStages.split(';');
            let ischanged: boolean = false;
            if (excludeTest) {
                if (excludes.indexOf('MockTest') === -1) {
                    ischanged = true;
                    excludes.push('MockTest');
                }
                if (excludes.indexOf('LiveTest') === -1) {
                    ischanged = true;
                    excludes.push('LiveTest');
                }
                resource.excludeStages = excludes.join(';');
            } else {
                let newArray = excludes.filter(
                    (item) => item !== 'MockTest' && item !== 'LiveTest'
                );
                if (newArray.length !== excludes.length) {
                    resource.excludeStages = newArray.join(';');
                    ischanged = true;
                }
            }

            if (ischanged) {
                fs.writeFileSync(
                    '/' + jsonMapFile,
                    JSON.stringify(resource, null, 2)
                );
                filepaths.push(jsonMapFile);
            }
        }

        let readfile = README.CLI_README_FILE;
        if (sdk === SDK.TF_SDK) {
            readfile = README.TF_README_FILE;
        }

        let tfSchemafile =
            'azurerm/internal/services/' + resourceProvider + '/schema.json';
        let tfSchemaDir = 'azurerm/internal/services/' + resourceProvider;
        const {
            org: sdkorg,
            repo: sdkreponame,
        } = this.githubDao.getGitRepoInfo(sdkrepo);
        const prNumber = codePR.split('/').pop();
        const filelist: string[] = [readfile];
        if (sdk === SDK.TF_SDK) {
            filelist.push(tfSchemafile);
            if (!fs.existsSync('/' + tfSchemaDir)) {
                fs.mkdirSync('/' + tfSchemaDir, { recursive: true });
            }
        }
        const readedFiles: string = await this.githubDao.readCustomizeFiles(
            sdkorg,
            sdkreponame,
            +prNumber,
            fs,
            filelist
        );

        /* copy configuration to swagger repo */
        const specpath =
            'specification/' + resourceProvider + '/resource-manager';
        if (!fs.existsSync('/' + specpath)) {
            fs.mkdirSync('/' + specpath, { recursive: true });
        }
        const swaggerReadMePath =
            'specification/' +
            resourceProvider +
            '/resource-manager/' +
            readfile;
        fs.copyFile('/' + readfile, '/' + swaggerReadMePath, (err) => {
            if (err) {
                this.logger.error('Error Found:', err);
            }
        });

        filepaths.push(swaggerReadMePath);

        if (sdk === SDK.TF_SDK && readedFiles.indexOf(tfSchemafile) !== -1) {
            const schemapath = 'schema.json';
            const swaggerSchemaPath =
                'specification/' +
                resourceProvider +
                '/resource-manager/' +
                schemapath;
            fs.copyFile('/' + tfSchemafile, '/' + swaggerSchemaPath, (err) => {
                if (err) {
                    console.log('Error Found:', err);
                }
            });
            filepaths.push(swaggerSchemaPath);
        }

        try {
            /* update depth-coverage-pipeline trigger pull request. */
            await this.githubDao.uploadToRepo(
                fs,
                filepaths,
                cgorg !== undefined ? cgorg : ORG.AZURE,
                cgreponame !== undefined
                    ? cgreponame
                    : REPO.DEPTH_COVERAGE_REPO,
                branch
            );
        } catch (e) {
            console.log(e);
            return e;
        }

        if (customizer === undefined) {
            /* update the code generation status. */
            await this.codeGenerationDao.updateCodeGenerationValueByName(
                name,
                CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
                CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING
            );
        }
        /* delete sdk rp branch. */

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

        const swaggerrepo = JSON.parse(codegen.swaggerRepo);
        const sdkrepo = JSON.parse(codegen.sdkRepo);

        /* generate PR in swagger repo. */
        let branch = codegen.name;
        // let branch = onboardtype + "-" + sdk + "-" + rp;

        const {
            org: swaggerorg,
            repo: swaggerreponame,
        } = this.githubDao.getGitRepoInfo(swaggerrepo);
        const swaggerPR = await this.githubDao.createPullRequest(
            swaggerorg !== undefined ? swaggerorg : ORG.AZURE,
            swaggerreponame !== undefined ? swaggerreponame : REPO.SWAGGER_REPO,
            swaggerrepo.branch,
            branch,
            '[' + type + ', ' + rp + ']pull request from pipeline ' + branch
        );

        /* generate PR in sdk code repo. */

        const {
            org: sdkorg,
            repo: sdkreponame,
        } = this.githubDao.getGitRepoInfo(sdkrepo);
        const codePR = await this.githubDao.createPullRequest(
            sdkorg,
            sdkreponame,
            sdkrepo.branch,
            branch,
            '[' + type + ', ' + rp + ']pull request from pipeline ' + branch
        );

        /* close work sdk branch. */
        let workbranch = codegen.name + '-code';
        await this.githubDao.deleteBranch(sdkorg, sdkreponame, workbranch);

        /* update the code generation status. */
        const values = {
            swaggerPR: swaggerPR,
            codePR: codePR,
            status: CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED,
        };
        await this.codeGenerationDao.updateCodeGenerationValuesByName(
            codegen.name,
            values
        );
    }

    public async publishTaskResult(
        pipelineBuildId: string,
        taskResult: CodegenPipelineTaskResult
    ) {
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
    public async generateCodePullRequest(
        org: string,
        repo: string,
        title: string,
        branch: string,
        basebranch: string
    ): Promise<string> {
        let prlink: string;
        const pulls: string[] = await this.githubDao.listOpenPullRequest(
            org,
            repo,
            branch,
            basebranch
        );
        if (pulls.length > 0) {
            prlink = pulls[0];
        } else {
            prlink = await this.githubDao.submitPullRequest(
                org,
                repo,
                title,
                branch,
                basebranch
            );
        }

        return prlink;
    }

    public async completeAllCodeGenerations() {
        /* Get all code generations which under pipeline completed status. */
        let codegens: CodeGeneration[] = await this.codeGenerationDao.listCodeGenerationsByStatus(
            CodeGenerationStatus.CODE_GENERATION_STATUS_PIPELINE_COMPLETED
        );
        for (let codegen of codegens) {
            const codepr = codegen.codePR;
            if (codepr !== undefined && codepr.length > 0) {
                const isMerged: boolean = await this.githubDao.isMergedPullRequest(
                    codepr
                );
                if (!isMerged) continue;
            }

            const swaggerpr = codegen.swaggerPR;
            if (swaggerpr !== undefined && swaggerpr.length > 0) {
                const isMerged: boolean = await this.githubDao.isMergedPullRequest(
                    swaggerpr
                );
                if (!isMerged) continue;
            }
            /* pr is merged. complete the code generation. */

            const err = this.completeCodeGeneration(codegen);
            if (err !== undefined) {
                console.log(
                    'Failed to complete code generation ' + codegen.toString()
                );
            } else {
                console.log(
                    'Code generation ' + codegen.toString() + ' is completed.'
                );
            }
        }
    }

    private async createCodeGenerationByCreatingPR(
        name: string,
        codegenOrg: string,
        codegenRepo: string,
        codegenBaseBranch: string,
        rpToGen: ResourceAndOperation,
        owner?: string
    ) {
        const branchName = name;
        const baseCommit = await this.githubDao.getCurrentCommit(
            codegenOrg,
            codegenRepo,
            codegenBaseBranch
        );

        await this.githubDao.createBranch(
            codegenOrg,
            codegenRepo,
            branchName,
            baseCommit.commitSha
        );

        const fs = new MemoryFileSystem();

        fs.writeFileSync(
            '/' + RESOUCEMAPFile,
            JSON.stringify(rpToGen, null, 2)
        );

        /* generate variable yml file */
        let st: string[] = this.collectPipelineStages(
            rpToGen.onboardType,
            rpToGen.target
        );
        let sdk: string = rpToGen.target;
        /* wrapped clicore and cliextension to cli. */
        if (sdk === SDK.CLI_CORE_SDK || sdk === SDK.CLI_EXTENSTION_SDK) {
            sdk = SDK.CLI;
        }
        const {
            org: swaggerOrg,
            repo: swaggerRepoName,
        } = this.githubDao.getGitRepoInfo(rpToGen.swaggerRepo);

        const {
            org: sdkOrg,
            repo: sdkRepoName,
        } = this.githubDao.getGitRepoInfo(rpToGen.sdkRepo);
        const v: PipelineVariablesInterface = {
            variables: {
                CodeGenerationName: name,
                SDK: sdk,
                stages: st.join(';'),
                SPEC_REPO_TYPE: rpToGen.swaggerRepo.type,
                SPEC_REPO_URL: rpToGen.swaggerRepo.path
                    .replace('https://', '')
                    .replace('http://', ''),
                SPEC_REPO_BASE_BRANCH: rpToGen.swaggerRepo.branch,
                SPEC_REPO_OWNER: swaggerOrg,
                SPEC_REPO_NAME: swaggerRepoName,
                SDK_REPO_TYPE: rpToGen.sdkRepo.type,
                SDK_REPO_URL: rpToGen.sdkRepo.path
                    .replace('https://', '')
                    .replace('http://', ''),
                SDK_REPO_BASE_BRANCH: rpToGen.sdkRepo.branch,
                SDK_REPO_OWNER: sdkOrg,
                SDK_REPO_NAME: sdkRepoName,
            },
        };
        fs.writeFileSync('/' + 'Variables.yml', yaml.dump(v));

        await this.githubDao.uploadToRepo(
            fs,
            ['ToGenerate.json', 'Variables.yml'],
            codegenOrg,
            codegenRepo,
            branchName
        );
        /* create pull request. */
        await this.githubDao.createPullRequest(
            codegenOrg,
            codegenRepo,
            codegenBaseBranch,
            branchName,
            'pull request from branch ' + branchName
        );

        let cg: CodeGeneration = new CodeGeneration();
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
        cg.status = CodeGenerationStatus.CODE_GENERATION_STATUS_SUBMIT;

        await this.codeGenerationDao.submitCodeGeneration(cg);
    }

    private collectPipelineStages(type: string, sdk: string): string[] {
        let stages: string[] = [];
        stages.push('Setup');
        stages.push('GenerateCode');
        if (this.needBuild(sdk)) {
            stages.push('Build');
        }
        stages.push('MockTest');
        stages.push('LiveTest');
        if (
            type === CodeGenerationType.DEPTH_COVERAGE ||
            type === CodeGenerationType.RELEASE
        ) {
            stages.push('Submit');
        }

        return stages;
    }

    private needBuild(sdk: string): boolean {
        if (sdk === SDK.TF_SDK || sdk === SDK.DOTNET_SDK || sdk === SDK.GO_SDK)
            return true;
        else return false;
    }
}
