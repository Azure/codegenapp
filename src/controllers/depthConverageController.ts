import { Request } from 'express';
import { check } from 'express-validator';
import { inject } from 'inversify';
import { controller, httpPost, httpPut } from 'inversify-express-utils';
import { JsonResult } from 'inversify-express-utils/dts/results';

import { config } from '../config';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { RepoInfo } from '../models/CodeGenerationModel';
import { DepthCoverageService } from '../service/depthCoverageService';
import { BaseController } from './baseController';

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
            codegenRepo = config.defaultCodegenRepo;
        }
        const candidate = req.body.candidateResources;
        const err = await this.depthCoverageService.triggerOnboard(
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
