import { MockServer } from 'jest-mock-server';

const originalEnv = process.env;
// eslint-disable-next-line  @typescript-eslint/no-var-requires
const axios = require('axios');

describe('Testing codeGenerateController', () => {
    const port = 9528;
    const server = new MockServer({ port });
    let codegenAppClient;

    beforeAll(async () => {
        process.env = {
            ...originalEnv,
            sdkGenerationAzurePipelineToken: '/sdkGenerationAzurePipelineToken',
            sdkGenerationAzurePipelineUrl: 'http://localhost:9528/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_apis/pipelines/14243/runs',
            sdkGenerationAzurePipelineRef: '/sdkGenerationAzurePipelineRef',
            sdkGenerationMongoDbHost: '127.0.0.1',
            sdkGenerationMongoDbPort: '27017',
            sdkGenerationMongoDbUsername: 'test',
            sdkGenerationMongoDbPassword: '123456',
            sdkGenerationMongoDbDatabase: 'admin',
            sdkGenerationEnableHttps: 'false',
            sdkGenerationMongoDbSsl: 'false',
            statsdEnable: 'false',
        };

        // eslint-disable-next-line  @typescript-eslint/no-var-requires
        codegenAppClient = require('../../src/codegenApp').codegenAppClient;
        await codegenAppClient.start();
        await server.start();
    });
    afterAll(async () => {
        await server.stop();
        await codegenAppClient.shutdown();
    });
    beforeEach(() => server.reset());

    test('codeGenerateController test basic api', async () => {
        const mock = server.post('/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_apis/pipelines/14243/runs').mockImplementation((ctx) => {
            ctx.status = 200;
            ctx.body = {
                _links: {
                    self: {
                        href: 'https://devdiv.visualstudio.com/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_apis/pipelines/14243/runs/5565942',
                    },
                    web: {
                        href: 'https://devdiv.visualstudio.com/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_build/results?buildId=5565942',
                    },
                    'pipeline.web': {
                        href: 'https://devdiv.visualstudio.com/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_build/definition?definitionId=14243',
                    },
                    pipeline: {
                        href: 'https://devdiv.visualstudio.com/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_apis/pipelines/14243?revision=46',
                    },
                },
                pipeline: {
                    url: 'https://devdiv.visualstudio.com/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_apis/pipelines/14243?revision=46',
                    id: 14243,
                    revision: 46,
                    name: 'Azure.sdk-pipeline-test',
                    folder: '\\',
                },
                state: 'inProgress',
                createdDate: '2021-12-21T07:44:53.3491556Z',
                url: 'https://devdiv.visualstudio.com/0bdbc590-a062-4c3f-b0f6-9383f67865ee/_apis/pipelines/14243/runs/5565942',
                resources: {
                    repositories: {
                        self: {
                            repository: {
                                fullName: 'Azure/azure-sdk-pipeline',
                                connection: {
                                    id: '230d215e-d66b-491d-90c7-68b40b2e8810',
                                },
                                type: 'gitHub',
                            },
                            refName: 'refs/heads/yc/shiftleft',
                            version: 'b1c5a3177099909e0a1486be51ce2c3b42b7209d',
                        },
                    },
                },
                id: 5565942,
                name: '20211221.3',
            };
        });

        let response = await axios.put(
            'http://localhost:3000/codegenerations/controllerTest',
            {
                resourceProvider: 'agrifood',
                sdk: 'go',
                type: 'ad-hoc',
                codegenRepo: {
                    type: 'github',
                    path: 'http://localhost:9528/testorg/testrepo',
                    branch: 'testbranch',
                },
                swaggerRepo: {
                    type: 'github',
                    path: 'http://localhost:9528/testorg/testrepo',
                    branch: 'testbranch',
                },
                sdkRepo: {
                    type: 'github',
                    path: 'http://localhost:9528/testorg/testrepo',
                    branch: 'testbranch',
                },
            },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
        );

        response = await axios.get('http://localhost:3000/codegenerations/controllerTest');
        expect(response.data.status).toBe('submit');

        await axios.patch('http://localhost:3000/codegenerations/controllerTest', {
            updateParameters: {
                status: 'customizing',
            },
        });

        response = await axios.get('http://localhost:3000/codegenerations/controllerTest/detail');
        expect(response.data.name).toBe('controllerTest');
        expect(response.data.status).toBe('customizing');

        response = await axios.post('http://localhost:3000/codegenerations/controllerTest/run');
        expect(response.status).toBe(200);

        response = await axios.post('http://localhost:3000/codegenerations/controllerTest/cancel');
        expect(response.status).toBe(200);

        response = await axios.post('http://localhost:3000/codegenerations/controllerTest/complete');
        expect(response.status).toBe(200);

        response = await axios.get('http://localhost:3000/codegenerations/');
        expect(response.data.length).toBeGreaterThan(0);

        response = await axios.delete('http://localhost:3000/codegenerations/controllerTest');
        expect(response.status).toBe(200);

        expect(mock).toHaveBeenCalled();

        return;
    });

    test('codeGenerateController test taskResult', async () => {
        await axios.post('http://localhost:3000/codegenerations/controllerTest/taskResult', {
            pipelineBuildId: 'testpipelineBuildId',
            taskResult: {
                name: 'testname',
                pipelineId: 'testpipelineId',
                subTaskKey: 'testsubTaskKey',
                checkRunId: 'testcheckRunId',
                checkRunUrl: 'testcheckRunUrl',
                queuedAt: 'testqueuedAt',
            },
        });
    });
});
