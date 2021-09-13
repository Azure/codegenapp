import { controller, httpPost, httpPut } from 'inversify-express-utils';
import { check } from 'express-validator/check';
import { Request } from 'express';
import { JsonResult } from 'inversify-express-utils/dts/results';
import { RepoInfo } from '../models/CodeGenerationModel';
import { BaseController } from './BaseController';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { inject } from 'inversify';
import { config } from '../config';
import { ENV } from '../config/env';
import { DepthCoverageService } from '../service/depthCoverageService';

@controller('/depthCoverage')
export class DepthCoverageController extends BaseController {
    @inject(InjectableTypes.DepthCoverageService)
    private depthCoverageService: DepthCoverageService;

    /*ingest depth-coverage candidates. */
    @httpPut('/sdk/:sdk/candidates', check('request').exists())
    public async candidates(request: Request): Promise<JsonResult> {
        const sdk = request.params.sdk;
        let candidates = request.body.candidates;
        await this.depthCoverageService.ingestCandidates(candidates, sdk);
        const statusCode = 200;
        const content = `ingest ${sdk} candidate`;
        this.logger.info(content);
        return this.json(content, statusCode);
    }

    /*trigger depth-coverage. */
    @httpPost('/trigger')
    public async trigger(req: Request): Promise<JsonResult> {
        /* The code gen pipeline org. */
        let codegenRepo: RepoInfo = req.body.codegenRepo;
        if (codegenRepo === undefined) {
            const platform = req.body.platform;
            if (platform !== undefined && platform.toLowerCase() === 'dev') {
                codegenRepo = config.defaultCodegenRepo;
            } else {
                codegenRepo = config.defaultCodegenRepo;
            }
        }
        const candidate = req.body.candidateResources;
        const err = await this.depthCoverageService.triggerOnboard(
            process.env[ENV.GITHUB_TOKEN],
            codegenRepo,
            candidate
        );
        let content;
        let statusCode;
        if (err !== undefined) {
            statusCode = 400;
            content = { error: err };
            this.logger.error('Failed to trigger depthcoverage.', err);
        } else {
            statusCode = 200;
            content = 'OK';
            this.logger.info('Trigger depthcoverage.');
        }
        return this.json(content, statusCode);
    }
}
