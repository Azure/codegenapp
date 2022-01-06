import { CodeGenerationStatus } from '../../src/models/CodeGenerationModel';
import { MockServer } from 'jest-mock-server';

const originalEnv = process.env;
// eslint-disable-next-line  @typescript-eslint/no-var-requires
const axios = require('axios');

describe('Testing codeGenerateController', () => {
    const pipelinePort = 9528;
    const gitPort = 9529;
    const pipelineMockServer = new MockServer({ port: pipelinePort });
    const gitMockServer = new MockServer({ port: gitPort });
    const codeGenServerPort = 3000;
    let codegenServer;

    beforeAll(async () => {
        process.env = {
            ...originalEnv,
            sdkGenerationAzurePipelineToken: '/sdkGenerationAzurePipelineToken',
            sdkGenerationAzurePipelineUrl: 'http://localhost:' + pipelinePort + '/0000/_apis/pipelines/14243/runs',
            sdkGenerationAzurePipelineRef: '/sdkGenerationAzurePipelineRef',
            sdkGenerationMongoDbHost: '127.0.0.1',
            sdkGenerationMongoDbPort: '27017',
            sdkGenerationMongoDbUsername: 'test',
            sdkGenerationMongoDbPassword: '123456',
            sdkGenerationMongoDbDatabase: 'admin',
            sdkGenerationEnableHttps: 'false',
            sdkGenerationMongoDbSsl: 'false',
            statsdEnable: 'false',
            sdkGenerationGithubBaseUrl: 'http://localhost:' + gitPort + '/githost',
        };

        // eslint-disable-next-line  @typescript-eslint/no-var-requires
        codegenServer = require('../../src/codegenApp').codegenAppServes;
        await codegenServer.start();
        await pipelineMockServer.start();
        await gitMockServer.start();
    });
    afterAll(async () => {
        await gitMockServer.stop();
        await pipelineMockServer.stop();
        await codegenServer.shutdown();
    });
    beforeEach(async () => {
        pipelineMockServer.reset();
        gitMockServer.reset();
    });

    test('codeGenerateController test basic api', async () => {
        const mockpipeline = pipelineMockServer.post('/0000/_apis/pipelines/14243/runs').mockImplementation((ctx) => {
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

        const mockgit = gitMockServer.all(/.*/).mockImplementation((ctx) => {
            ctx.status = 200;
        });

        let response = await axios.put(
            'http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest',
            {
                resourceProvider: 'agrifood',
                sdk: 'go',
                type: 'ad-hoc',
                codegenRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
                    branch: 'testbranch',
                },
                swaggerRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
                    branch: 'testbranch',
                },
                sdkRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
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
        expect(response.status).toBe(200);
        expect(mockpipeline).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/0000/_apis/pipelines/14243/runs',
                request: expect.objectContaining({
                    method: 'POST',
                    url: '/0000/_apis/pipelines/14243/runs',
                }),
            }),
            expect.any(Function),
        );
        mockpipeline.mockClear();

        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest');
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('submit');
        expect(response.data.id).not.toBe(null);
        expect(response.data.name).toBe('controllerTest');
        expect(response.data.resourceProvider).toBe('agrifood');
        expect(response.data.sdk).toBe('go');
        expect(response.data.type).toBe('ad-hoc');
        expect(response.data.codegenRepo).not.toBe(null);
        expect(response.data.swaggerRepo).not.toBe(null);
        expect(response.data.sdkRepo).not.toBe(null);

        response = await axios.patch('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest', {
            updateParameters: {
                status: 'customizing',
            },
        });
        expect(response.status).toBe(200);

        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest/detail');
        expect(response.status).toBe(200);
        expect(response.data.name).toBe('controllerTest');
        expect(response.data.status).toBe('customizing');

        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest/run');
        expect(response.status).toBe(200);
        expect(mockpipeline).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/0000/_apis/pipelines/14243/runs',
                request: expect.objectContaining({
                    method: 'POST',
                    url: '/0000/_apis/pipelines/14243/runs',
                }),
            }),
            expect.any(Function),
        );
        mockpipeline.mockClear();
        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest');
        expect(response.status).toBe(200);
        expect(response.data.id).not.toBe(null);
        expect(response.data.status).toBe('submit');

        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest/cancel');
        expect(mockgit).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/githost/repos/testorg/testrepo/git/refs/heads%2FcontrollerTest',
                request: expect.objectContaining({
                    method: 'DELETE',
                    url: '/githost/repos/testorg/testrepo/git/refs/heads%2FcontrollerTest',
                }),
            }),
            expect.any(Function),
        );
        mockgit.mockClear();
        expect(response.status).toBe(200);
        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest');
        expect(response.status).toBe(200);
        expect(response.data.id).not.toBe(null);
        expect(response.data.status).toBe('cancelled');

        response = await axios.patch('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest', {
            updateParameters: {
                status: 'customizing',
            },
        });
        expect(response.status).toBe(200);
        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest/complete');
        expect(mockgit).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/githost/repos/testorg/testrepo/git/refs/heads%2FcontrollerTest',
                request: expect.objectContaining({
                    method: 'DELETE',
                    url: '/githost/repos/testorg/testrepo/git/refs/heads%2FcontrollerTest',
                }),
            }),
            expect.any(Function),
        );
        mockgit.mockClear();
        expect(response.status).toBe(200);
        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest');
        expect(response.status).toBe(200);
        expect(response.data.id).not.toBe(null);
        expect(response.data.status).toBe('completed');

        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest/onboard');
        expect(mockgit).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/githost/repos/testorg/testrepo/pulls',
                request: expect.objectContaining({
                    method: 'POST',
                    url: '/githost/repos/testorg/testrepo/pulls',
                }),
            }),
            expect.any(Function),
        );
        mockgit.mockClear();
        expect(response.status).toBe(200);

        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest/onboard');
        expect(mockgit).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/githost/repos/testorg/testrepo/pulls',
                request: expect.objectContaining({
                    method: 'POST',
                    url: '/githost/repos/testorg/testrepo/pulls',
                }),
            }),
            expect.any(Function),
        );
        mockgit.mockClear();
        expect(response.status).toBe(200);

        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations');
        expect(response.status).toBe(200);
        expect(response.data.length).toBeGreaterThan(0);

        response = await axios.delete('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest');
        expect(response.status).toBe(200);
        expect(mockgit).toHaveBeenCalledWith(
            expect.objectContaining({
                originalUrl: '/githost/repos/testorg/testrepo/git/refs/heads%2FcontrollerTest',
                request: expect.objectContaining({
                    method: 'DELETE',
                    url: '/githost/repos/testorg/testrepo/git/refs/heads%2FcontrollerTest',
                }),
            }),
            expect.any(Function),
        );
        mockgit.mockClear();

        // check whether delete operation take effect
        await expect(axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest')).rejects.toThrow(Error);

        return;
    });

    test('codeGenerateController test taskResult', async () => {
        const mockpipeline = pipelineMockServer.post('/0000/_apis/pipelines/14243/runs').mockImplementation((ctx) => {
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
                id: 5565943,
                name: '20211221.3',
            };
        });

        const mockgit = gitMockServer.all(/.*/).mockImplementation((ctx) => {
            ctx.status = 200;
        });

        let response = await axios.put(
            'http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest2',
            {
                resourceProvider: 'agrifood',
                sdk: 'go',
                type: 'ad-hoc',
                codegenRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
                    branch: 'testbranch',
                },
                swaggerRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
                    branch: 'testbranch',
                },
                sdkRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
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
        expect(response.status).toBe(200);
        expect(mockpipeline).toHaveBeenCalled();
        mockpipeline.mockClear();

        await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest2/taskResult', {
            pipelineBuildId: '5565943',
            taskResult: {
                name: 'testname',
                pipelineId: 'testpipelineId',
                subTaskKey: 'testsubTaskKey',
                checkRunId: 'testcheckRunId',
                checkRunUrl: 'testcheckRunUrl',
                queuedAt: 'testqueuedAt',
            },
        });

        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest2/detail');
        expect(response.status).toBe(200);
        expect(response.data.name).toBe('controllerTest2');
        expect(response.data.taskResults.length).toBeGreaterThan(0);

        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest2/complete');
        expect(mockgit).toHaveBeenCalled();
        mockgit.mockClear();
        expect(response.status).toBe(200);

        response = await axios.delete('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest2');
        expect(response.status).toBe(200);
        expect(mockgit).toHaveBeenCalled();
        mockgit.mockClear();

        return;
    });

    test('codeGenerateController negative case', async () => {
        const mockpipeline = pipelineMockServer.post('/0000/_apis/pipelines/14243/runs').mockImplementation((ctx) => {
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
                id: 5565943,
                name: '20211221.3',
            };
        });

        const mockgit = gitMockServer.all(/.*/).mockImplementation((ctx) => {
            ctx.status = 200;
        });

        let response = await axios.put(
            'http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3',
            {
                resourceProvider: 'agrifood',
                sdk: 'go',
                type: 'ad-hoc',
                codegenRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
                    branch: 'testbranch',
                },
                swaggerRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
                    branch: 'testbranch',
                },
                sdkRepo: {
                    type: 'github',
                    path: 'https://github.com/testorg/testrepo',
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
        expect(response.status).toBe(200);
        expect(mockpipeline).toHaveBeenCalled();
        mockpipeline.mockClear();

        // check create two codeGen entity with same name
        await expect(
            axios.put(
                'http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3',
                {
                    resourceProvider: 'agrifood',
                    sdk: 'go',
                    type: 'ad-hoc',
                    codegenRepo: {
                        type: 'github',
                        path: 'https://github.com/testorg/testrepo',
                        branch: 'testbranch',
                    },
                    swaggerRepo: {
                        type: 'github',
                        path: 'https://github.com/testorg/testrepo',
                        branch: 'testbranch',
                    },
                    sdkRepo: {
                        type: 'github',
                        path: 'https://github.com/testorg/testrepo',
                        branch: 'testbranch',
                    },
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
            ),
        ).rejects.toThrow(Error);

        response = await axios.patch('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3', {
            updateParameters: {
                status: CodeGenerationStatus.CodeGenerationStatusInProgress,
            },
        });
        expect(response.status).toBe(200);

        // codeGen at CodeGenerationStatusInProgress status should not customize
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/customize')).rejects.toThrow(Error);
        await expect(axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/customize')).rejects.toThrow(Error);

        response = await axios.patch('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3', {
            updateParameters: {
                status: CodeGenerationStatus.CodeGenerationStatusCustomizing,
            },
        });
        expect(response.status).toBe(200);

        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/customize');
        expect(response.status).toBe(201);

        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/customize');
        expect(response.status).toBe(201);

        response = await axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/cancel');
        expect(response.status).toBe(200);
        expect(mockgit).toHaveBeenCalled();
        mockgit.mockClear();
        response = await axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/detail');
        expect(response.status).toBe(200);
        expect(response.data.status).toBe(CodeGenerationStatus.CodeGenerationStatusCancelled);

        // codeGen at CodeGenerationStatusCancelled status can't be customized/ran
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/complete')).rejects.toThrow(Error);
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3/run')).rejects.toThrow(Error);

        response = await axios.delete('http://localhost:' + codeGenServerPort + '/codegenerations/controllerTest3');
        expect(response.status).toBe(200);
        expect(mockgit).toHaveBeenCalled();
        mockgit.mockClear();

        // call with notexisted codeGen name
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/customize')).rejects.toThrow(Error);
        await expect(axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/customize')).rejects.toThrow(Error);
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/onboard')).rejects.toThrow(Error);
        await expect(axios.get('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/onboard')).rejects.toThrow(Error);
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/complete')).rejects.toThrow(Error);
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/cancel')).rejects.toThrow(Error);
        await expect(axios.post('http://localhost:' + codeGenServerPort + '/codegenerations/notexist/run')).rejects.toThrow(Error);

        return;
    });
});
