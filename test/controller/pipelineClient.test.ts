import { MockServer } from 'jest-mock-server';

const originalEnv = process.env;

describe('Testing pipelineClient', () => {
    const pipelinePort = 9527;
    const server = new MockServer({ port: pipelinePort });
    let azurePipelineClient;

    beforeAll(async () => {
        process.env = {
            ...originalEnv,
            sdkGenerationAzurePipelineToken: '/sdkGenerationAzurePipelineToken',
            sdkGenerationAzurePipelineUrl: 'http://localhost:' + pipelinePort + '/0000/_apis/pipelines/14243/runs',
            sdkGenerationAzurePipelineRef: '/sdkGenerationAzurePipelineRef',
        };
        // eslint-disable-next-line  @typescript-eslint/no-var-requires
        azurePipelineClient = require('../../src/utils/pipelineClient').azurePipelineClient; // use 'import' will cause config init before process.env setup
        await server.start();
    });
    afterAll(() => server.stop());
    beforeEach(() => server.reset());

    test('Test pipelineClient', async () => {
        const mock = server.post('/0000/_apis/pipelines/14243/runs').mockImplementation((ctx) => {
            ctx.status = 200;
            ctx.body = {
                _links: {
                    self: {
                        href: 'http://localhost:' + pipelinePort + '/0000/_apis/pipelines/14243/runs/5565942',
                    },
                    web: {
                        href: 'http://localhost:' + pipelinePort + '/0000/_build/results?buildId=5565942',
                    },
                    'pipeline.web': {
                        href: 'http://localhost:' + pipelinePort + '/0000/_build/definition?definitionId=14243',
                    },
                    pipeline: {
                        href: 'http://localhost:' + pipelinePort + '/0000/_apis/pipelines/14243?revision=46',
                    },
                },
                pipeline: {
                    url: 'http://localhost:' + pipelinePort + '/0000/_apis/pipelines/14243?revision=46',
                    id: 14243,
                    revision: 46,
                    name: 'Azure.sdk-pipeline-test',
                    folder: '\\',
                },
                state: 'inProgress',
                createdDate: '2021-12-21T07:44:53.3491556Z',
                url: 'http://localhost:' + pipelinePort + '/0000/_apis/pipelines/14243/runs/5565942',
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

        const response = await azurePipelineClient.runPipeline({
            sdkGenerationName: 'name1',
            sdk: 'string',
            resourceProvider: 'string',
            readmeFile: 'string',
            triggerType: 'string',
            specRepoType: 'string',
            specRepoUrl: 'string',
            specRepoBaseBranch: 'string',
            sdkRepoType: 'string',
            sdkRepoUrl: 'string',
            sdkRepoBaseBranch: 'string',
            skippedTask: 'string',
            serviceType: 'string',
        });

        expect(response.status).toEqual(200);

        expect(mock).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
            }),
            expect.any(Function),
        );
    });
});
