import { config } from '../config';
import { injectableTypes } from '../injectableTypes/injectableTypes';
import { CodeGenerationStatus, RepoInfo } from '../models/CodeGenerationModel';
import { ServiceType } from '../models/ResourceAndOperationModel';
import { CodeGenerationType } from '../models/common';
import { CodeGeneration } from '../models/entity/CodeGeneration';
import { CodegenPipelineTaskResult } from '../models/entity/TaskResult';
import { CodeGenerationService } from '../service/codeGenerationService';
import { BaseController } from './baseController';
import { Request } from 'express';
import { inject } from 'inversify';
import { controller, httpDelete, httpGet, httpPatch, httpPost, httpPut } from 'inversify-express-utils';
import { JsonResult } from 'inversify-express-utils/dts/results';

@controller('/codegenerations')
export class CodeGenerateController extends BaseController {
    @inject(injectableTypes.CodeGenerationService)
    private codeGenerationService: CodeGenerationService;

    /* generate an pull request. */
    @httpPost('/generatePullRequest')
    public async generateCodePullRequest(request: Request): Promise<JsonResult> {
        const org = request.body.org;
        const repo = request.body.repo;
        const title = request.body.title;
        const branch = request.body.branch;
        const baseBranch = request.body.base;

        const prLink = await this.codeGenerationService.generateCodePullRequest(org, repo, title, branch, baseBranch);
        return this.json(prLink, 200);
    }

    /*generate source code. */
    @httpPut('/:codegenname')
    public async createSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;

        const resourceProvider = request.body.resourceProvider;
        const sdk: string = request.body.sdk;
        const resources: string = request.body.resources;
        let serviceType = request.body.serviceType;
        if (serviceType === undefined) {
            serviceType = ServiceType.ResourceManager;
        }
        const tag = request.body.tag;
        const commit = request.body.commit;
        const owners = request.body.contactAliases;

        let codegenRepo: RepoInfo;
        if (request.body.codegenRepo !== undefined) {
            codegenRepo = request.body.codegenRepo as RepoInfo;
            codegenRepo.path = codegenRepo.path.replace('.git', '');
        } else {
            codegenRepo = config.defaultCodegenRepo;
        }

        let swaggerRepo: RepoInfo;
        if (request.body.swaggerRepo !== undefined) {
            swaggerRepo = request.body.swaggerRepo as RepoInfo;
            swaggerRepo.path = swaggerRepo.path.replace('.git', '');
        } else {
            swaggerRepo = config.defaultSwaggerRepo;
        }

        let sdkRepo: RepoInfo;
        if (request.body.sdkRepo !== undefined) {
            sdkRepo = request.body.sdkRepo as RepoInfo;
            sdkRepo.path = sdkRepo.path.replace('.git', '');
        } else {
            sdkRepo = config.defaultSDKRepos[sdk];
        }

        let triggerType = request.body.type;
        if (triggerType === undefined) {
            triggerType = CodeGenerationType.Adhoc;
        }
        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);
        if (
            codegen !== undefined &&
            codegen.status !== CodeGenerationStatus.CodeGenerationStatusCompleted &&
            codegen.status !== CodeGenerationStatus.CodeGenerationStatusCancelled
        ) {
            const message = `The code generation pipeline(${resourceProvider}, ${sdk} is under ${codegen.status}) already. Ignore this trigger.`;
            this.logger.info(message);
            return this.json(message, 400);
        }

        await this.codeGenerationService.createCodeGeneration(
            name,
            resourceProvider,
            resources,
            sdk,
            triggerType,
            serviceType,
            swaggerRepo,
            codegenRepo,
            sdkRepo,
            commit,
            owners !== undefined ? owners.join(';') : '',
            tag,
        );
        return this.json('Trigger ' + triggerType + ' for resource provider ' + resourceProvider, 200);
    }

    /* get sdk code generation. */
    @httpGet('/:codegenname')
    public async getSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;
        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);
        if (!codegen) {
            this.logger.info('The code generation (' + name + ') does not exist.');
            return this.json('Not Exist.', 400);
        } else {
            return this.json(codegen, 200);
        }
    }

    /* update sdk code generation. */
    @httpPatch('/:codegenname')
    public async updateSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('The code generation (' + name + ') does not exist.');
            return this.json({ error: 'Not Exist.' }, 400);
        }

        const values = request.body.updateParameters;

        await this.codeGenerationService.updateCodeGenerationValuesByName(name, values);

        const content = 'Updated code generation ' + name + ' for ' + codegen.resourceProvider + ' sdk:' + codegen.sdk;
        const statusCode = 200;
        this.logger.info(content);
        return this.json(content, statusCode);
    }

    /* delete sdk code generation. */
    @httpDelete('/:codegenname')
    public async deleteSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('The code generation (' + name + ') does not exist.');
            return this.json({ error: 'Not Exist.' }, 400);
        } else if (codegen.status !== CodeGenerationStatus.CodeGenerationStatusCompleted && codegen.status !== CodeGenerationStatus.CodeGenerationStatusCancelled) {
            const message = `Cannot delete codegen ${name} because its status is ${codegen.status}`;
            this.logger.info(message);
            return this.json({ error: message }, 400);
        }

        await this.codeGenerationService.deleteSDKCodeGeneration(codegen);

        return this.json('OK', 200);
    }

    /* get sdk code generation detail information. */
    @httpGet('/:codegenname/detail')
    public async getSDKCodeGenerationDetailInfo(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('The code generation (' + name + ') does not exist.');
            return this.json('Not Exist.', 400);
        }

        const pipelineid: string = codegen.lastPipelineBuildID;
        const taskResults: CodegenPipelineTaskResult[] = await this.codeGenerationService.getTaskResultByPipelineId(pipelineid);
        const cginfo = {
            name: codegen.name,
            resourceProvider: codegen.resourceProvider,
            serviceType: codegen.serviceType,
            resourcesToGenerate: codegen.resourcesToGenerate,
            tag: codegen.tag,
            sdk: codegen.sdk,
            swaggerRepo: JSON.parse(codegen.swaggerRepo),
            sdkRepo: JSON.parse(codegen.sdkRepo),
            codegenRepo: JSON.parse(codegen.codegenRepo),
            owner: codegen.owner,
            type: codegen.type,
            swaggerPR: codegen.swaggerPR,
            codePR: codegen.codePR,
            lastPipelineBuildID: codegen.lastPipelineBuildID,
            status: codegen.status,
            taskResults: taskResults,
        };

        return this.json(cginfo, 200);
    }

    /* list sdk code generations. */
    @httpGet('/')
    public async listALLSDKCodeGenerations(request: Request): Promise<JsonResult> {
        const filters = request.query;
        const codegens: CodeGeneration[] = await this.codeGenerationService.listCodeGenerations(filters, false);
        return this.json(codegens, 200);
    }

    /*complete one code generation after all the code have been merged. */
    @httpPost('/:codegenname/complete')
    public async completeSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;
        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('The code generation (' + name + ') does not exist.');
            return this.json({ error: 'Not Exist.' }, 400);
        } else if (codegen.status === CodeGenerationStatus.CodeGenerationStatusCompleted && codegen.status === CodeGenerationStatus.CodeGenerationStatusCancelled) {
            const message = `Cannot complete code generation ${name} because it's status is ${codegen.status}.`;
            this.logger.info(message);
            return this.json({ error: message }, 400);
        }

        await this.codeGenerationService.completeCodeGeneration(codegen);

        const statusCode = 200;
        const content = 'Complete ' + name + ' for resource provider ' + codegen.resourceProvider;
        this.logger.info(content);

        return this.json(content, statusCode);
    }

    /*cancel one code generation. */
    @httpPost('/:codegenname/cancel')
    public async cancelSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;
        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('The code generation (' + name + ') does not exist.');
            return this.json('Not Exist.', 400);
        }

        await this.codeGenerationService.cancelCodeGeneration(codegen);

        const statusCode = 200;
        const content = 'Cancel ' + name + ' for resource provider ' + codegen.resourceProvider;
        this.logger.info(content);
        return this.json(content, statusCode);
    }

    /*run one code generation. */
    @httpPost('/:codegenname/run')
    public async runCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;
        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (codegen === undefined) {
            this.logger.info('code generation ' + name + ' does not exist. No run triggered.');
            return this.json('Not Exist.', 400);
        } else if (codegen.status === CodeGenerationStatus.CodeGenerationStatusInProgress || codegen.status === CodeGenerationStatus.CodeGenerationStatusCancelled) {
            const message = 'The code generation ' + name + '(' + codegen.resourceProvider + ',' + codegen.sdk + ') is under ' + codegen.status + '. No avaialbe to run now.';
            this.logger.info(message);
            return this.json({ error: message }, 400);
        }

        await this.codeGenerationService.runCodeGeneration(codegen);
        const message = "Succeeded to run code generation '" + name + "'( " + codegen.resourceProvider + ', ' + codegen.sdk + ').';

        this.logger.info(message);
        return this.json(message, 200);
    }

    /* customize the code generation. */
    @httpPost('/:codegenname/customize')
    public async customizeSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;
        const triggerPR = request.body.triggerPR as string;
        const codePR = request.body.codePR as string;

        let excludeTest = false;
        if (request.query.excludeTest !== undefined) {
            excludeTest = Boolean(request.query.excludeTest);
        }

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            const message = 'code generation ' + name + ' does not exist. No customize triggered.';
            this.logger.info(message);
            return this.json({ error: message }, 400);
        } else if (codegen.status === CodeGenerationStatus.CodeGenerationStatusInProgress || codegen.status === CodeGenerationStatus.CodeGenerationStatusCancelled) {
            const message =
                'The code generation ' + name + '(' + codegen.resourceProvider + ',' + codegen.sdk + ') is under ' + codegen.status + '. Not avaialbe to trigger customize now.';
            this.logger.info(message);
            return this.json({ error: message }, 400);
        } else if (codegen.status === CodeGenerationStatus.CodeGenerationStatusCustomizing) {
            const message = 'The code generation ' + name + '(' + codegen.resourceProvider + ',' + codegen.sdk + ') is under ' + codegen.status + 'Already. Ignore this trigger.';
            this.logger.info(message);
            return this.json('customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=' + codegen.lastPipelineBuildID, 201);
        }

        await this.codeGenerationService.customizeCodeGeneration(name, triggerPR, codePR, excludeTest);

        this.logger.info("Succeeded to customize code generation '" + name + "'( " + codegen.resourceProvider + ', ' + codegen.sdk + ').');
        return this.json('customize.pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=' + codegen.lastPipelineBuildID, 200);
    }

    /* customize the code generation. */
    @httpGet('/:codegenname/customize')
    public async customizeSDKCodeGenerationGet(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;
        const triggerPR = request.query.triggerPR as string;
        const codePR = request.query.codePR as string;

        let excludeTest = false;
        if (request.query.excludeTest !== undefined) {
            excludeTest = Boolean(request.query.excludeTest);
        }

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('code generation ' + name + ' does not exist. No customize triggered.');
            return this.json({ error: 'No available code generation to trigger customize.' }, 400);
        } else if (
            codegen.status === CodeGenerationStatus.CodeGenerationStatusCompleted ||
            codegen.status === CodeGenerationStatus.CodeGenerationStatusInProgress ||
            codegen.status === CodeGenerationStatus.CodeGenerationStatusCancelled
        ) {
            this.logger.info(
                'The code generation ' + name + '(' + codegen.resourceProvider + ',' + codegen.sdk + ') is under ' + codegen.status + '. Not avaialbe to trigger customize now.',
            );
            return this.json({ error: 'Not available to trigger customize now' }, 400);
        } else if (codegen.status === CodeGenerationStatus.CodeGenerationStatusCustomizing) {
            this.logger.info('The code generation ' + name + '(' + codegen.resourceProvider + ',' + codegen.sdk + ') is under ' + codegen.status + 'Already. Ignore this trigger.');
            return this.json('customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=' + codegen.lastPipelineBuildID, 201);
        }

        const customizer = await this.codeGenerationService.customizeCodeGeneration(name, triggerPR, codePR, excludeTest);

        if (customizer !== undefined) {
            this.logger.error("Failed to customize code generation '" + name + "'( " + codegen.resourceProvider + ', ' + codegen.sdk + ').', customizer);
            return this.json({ error: customizer }, 400);
        } else {
            this.logger.info("Succeeded to customize code generation '" + name + "'( " + codegen.resourceProvider + ', ' + codegen.sdk + ').');
            return this.json('customize. pipeline: https://devdiv.visualstudio.com/DevDiv/_build?definitionId=' + codegen.lastPipelineBuildID, 201);
        }
    }

    /*onboard one codegeneration, submit generated code to sdk repo and readme to swagger repo. */
    @httpPost('/:codegenname/onboard')
    public async onboardSDKCodeGeneration(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('code generation ' + name + ' does not exist. No onboard triggered.');
            return this.json({ error: 'No available code generation to onboard.' }, 400);
        }

        await this.codeGenerationService.submitGeneratedCode(codegen);

        const statusCode = 200;
        const content = 'Succeed to onboard ' + name + '(' + codegen.sdk + ', ' + codegen.resourceProvider + ').';

        return this.json(content, statusCode);
    }

    /*onboard one codegeneration, submit generated code to sdk repo and readme to swagger repo. */
    @httpGet('/:codegenname/onboard')
    public async onboardSDKCodeGenerationGet(request: Request): Promise<JsonResult> {
        const name = request.params.codegenname;

        const codegen = await this.codeGenerationService.getCodeGenerationByName(name);

        if (!codegen) {
            this.logger.info('code generation ' + name + ' does not exist. No onboard triggered.');
            return this.json({ error: 'No available code generation to onboard.' }, 400);
        }

        await this.codeGenerationService.submitGeneratedCode(codegen);

        const statusCode = 200;
        const content = 'Succeed to onboard ' + name + '(' + codegen.sdk + ', ' + codegen.resourceProvider + ').';
        this.logger.info(content);

        return this.json(content, statusCode);
    }

    /*generate code snipper. */
    @httpPost('/codeSnipper')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async generateSDKCodeSnipper(request: Request) {
        return this.json('Not Implemented', 200);
    }

    /* submit pipeline result to cosmosdb. */
    @httpPost('/:codegenname/taskResult')
    public async publishPipelineResult(request: Request): Promise<JsonResult> {
        const buildId: string = request.body.pipelineBuildId;
        const result: CodegenPipelineTaskResult = request.body.taskResult;
        await this.codeGenerationService.publishTaskResult(buildId, result);

        return undefined;
    }
}
