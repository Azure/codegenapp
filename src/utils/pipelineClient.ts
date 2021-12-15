import { config } from '../config';
import { RunAzurePipelineBodyModel, TemplateParameters } from '../models/RunAzurePipelineBodyModel';
import { AxiosResponse } from 'axios';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');

export class AzurePipelineClient {
    public async runPipeline(templateParameters: TemplateParameters): Promise<AxiosResponse> {
        const body: RunAzurePipelineBodyModel = {
            resources: {
                repositories: {
                    self: {
                        refName: `refs/heads/${config.azurePipelineRef}`,
                    },
                },
            },
            templateParameters: templateParameters,
        };
        const response = await axios.post(config.azurePipelineUrl, body, {
            headers: {
                Authorization: config.azurePipelineToken,
            },
        });
        return response;
    }
}

export const azurePipelineClient = new AzurePipelineClient();
