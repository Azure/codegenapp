import { CodeGenerationDao } from '../../src/dao/codeGenerationDao';
import { CodeGenerationDaoImpl } from '../../src/daoImpl/codeGenerationDaoImpl';
import { injectableTypes } from '../../src/injectableTypes/injectableTypes';
import { CodeGeneration } from '../../src/models/entity/CodeGeneration';
import { Container } from 'inversify';
import { Connection, createConnection } from 'typeorm';

let mongoDbConnection: Connection;
let container: Container;

async function initDaoTest() {
    mongoDbConnection = await createConnection({
        name: 'mongodb',
        type: 'mongodb',
        host: '127.0.0.1',
        port: 27017,
        username: 'test',
        password: '123456',
        database: 'admin',
        synchronize: true,
        logging: true,
        entities: [CodeGeneration],
    });

    container = new Container();
    container.bind<CodeGenerationDao>(injectableTypes.CodeGenerationDao).to(CodeGenerationDaoImpl);
    container.bind<Connection>(injectableTypes.MongoDbConnection).toConstantValue(mongoDbConnection);
}

beforeAll(initDaoTest);

test('dao test submitCodeGeneration and getCodeGenerationByName1', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test1a';
    cg.resourceProvider = 'msi';
    cg.serviceType = 'resource-manager';
    cg.resourcesToGenerate = '';
    cg.tag = null;
    cg.sdk = 'javascript';
    cg.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.owner = 'SDK';
    cg.type = 'ad-hoc';
    cg.status = 'submit';

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    await codeGenerationDao.submitCodeGeneration(cg);

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName(cg.name);
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBeNull();
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.sdkRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.codegenRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SDK');
    expect(retCg.type).toBe('ad-hoc');
    expect(retCg.status).toBe('submit');
});

test('dao test submitCodeGeneration and getCodeGenerationByName2', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test1b';
    cg.resourceProvider = 'msi';
    cg.serviceType = 'resource-manager';
    cg.resourcesToGenerate = '';
    cg.tag = null;
    cg.sdk = 'javascript';
    cg.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.type = 'ad-hoc';
    cg.status = 'submit';
    cg.ignoreFailure = null;
    cg.stages = null;
    cg.swaggerPR = null;
    cg.codePR = null;
    cg.owner = null;

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    await codeGenerationDao.submitCodeGeneration(cg);

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName(cg.name);
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBeNull();
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.sdkRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.codegenRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBeNull();
    expect(retCg.type).toBe('ad-hoc');
    expect(retCg.status).toBe('submit');
    expect(retCg.ignoreFailure).toBeNull();
    expect(retCg.stages).toBeNull();
    expect(retCg.swaggerPR).toBeNull();
    expect(retCg.codePR).toBeNull();
});

test('dao test submitCodeGeneration and getCodeGenerationByName3', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test1c';
    cg.resourceProvider = 'msi';
    cg.serviceType = 'resource-manager';
    cg.resourcesToGenerate = '';
    cg.tag = null;
    cg.sdk = 'javascript';
    cg.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.type = 'ad-hoc';
    cg.status = 'submit';
    cg.ignoreFailure = null;
    cg.stages = null;
    cg.swaggerPR = null;
    cg.codePR = null;
    cg.owner = null;

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    const mockFn = jest.fn();

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.name = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.resourceProvider = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.serviceType = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.sdk = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.swaggerRepo = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.sdkRepo = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.codegenRepo = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.type = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    try {
        cg.status = null;
        await codeGenerationDao.submitCodeGeneration(cg);
    } catch (error) {
        mockFn();
    }
    expect(mockFn).toBeCalledTimes(9);
});

test('dao test submitCodeGeneration, updateCodeGenerationValueByName and getCodeGenerationByName', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test2';
    cg.resourceProvider = 'msi';
    cg.serviceType = 'resource-manager';
    cg.resourcesToGenerate = null;
    cg.tag = null;
    cg.sdk = 'javascript';
    cg.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.owner = 'SDK';
    cg.type = 'ad-hoc';
    cg.status = 'submit';

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    await codeGenerationDao.submitCodeGeneration(cg);
    await codeGenerationDao.updateCodeGenerationValueByName(cg.name, 'owner', 'SWG');
    const mockFn = jest.fn();
    try {
        await codeGenerationDao.updateCodeGenerationValueByName(cg.name, 'status', null);
    } catch (error) {
        mockFn();
    }
    expect(mockFn).toBeCalledTimes(1);

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName(cg.name);
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBeNull();
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.sdkRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.codegenRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SWG');
    expect(retCg.type).toBe('ad-hoc');
    expect(retCg.status).toBe('submit');
});

test('dao test submitCodeGeneration, getCodeGenerationByName and deleteCodeGenerationByName', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test3';
    cg.resourceProvider = 'msi';
    cg.serviceType = 'resource-manager';
    cg.resourcesToGenerate = '';
    cg.tag = null;
    cg.sdk = 'javascript';
    cg.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.owner = 'SDK';
    cg.type = 'ad-hoc';
    cg.status = 'submit';

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    await codeGenerationDao.submitCodeGeneration(cg);

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName(cg.name);
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBeNull();
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.sdkRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.codegenRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SDK');
    expect(retCg.type).toBe('ad-hoc');
    expect(retCg.status).toBe('submit');

    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    const reqCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName(cg.name);
    expect(reqCg).toBe(undefined);
});

test('dao test submitCodeGeneration, updateCodeGenerationValuesByName and getCodeGenerationByName', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test4';
    cg.resourceProvider = 'msi';
    cg.serviceType = 'resource-manager';
    cg.resourcesToGenerate = '';
    cg.tag = null;
    cg.sdk = 'javascript';
    cg.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg.owner = 'SDK';
    cg.type = 'ad-hoc';
    cg.status = 'submit';

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg.name);
    await codeGenerationDao.submitCodeGeneration(cg);
    await codeGenerationDao.updateCodeGenerationValuesByName(cg.name, { type: 'ad-real', status: 'del' });

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName(cg.name);
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBeNull();
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.sdkRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.codegenRepo).toBe('{"type":"github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SDK');
    expect(retCg.type).toBe('ad-real');
    expect(retCg.status).toBe('del');

    const mockFn = jest.fn();
    try {
        await codeGenerationDao.updateCodeGenerationValuesByName(cg.name, { status: null });
    } catch (error) {
        mockFn();
    }
    expect(mockFn).toBeCalledTimes(1);
});

test('dao test submitCodeGeneration and listCodeGenerationsByStatus', async () => {
    const cg1: CodeGeneration = new CodeGeneration();
    cg1.name = 'test5a';
    cg1.resourceProvider = 'msi';
    cg1.serviceType = 'resource-manager';
    cg1.resourcesToGenerate = '';
    cg1.tag = null;
    cg1.sdk = 'javascript';
    cg1.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg1.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg1.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg1.owner = 'SDK';
    cg1.type = 'ad-hoc';
    cg1.status = 'completed';

    const cg2: CodeGeneration = new CodeGeneration();
    cg2.name = 'test5b';
    cg2.resourceProvider = 'msi';
    cg2.serviceType = 'resource-manager';
    cg2.resourcesToGenerate = '';
    cg2.tag = null;
    cg2.sdk = 'javascript';
    cg2.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg2.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg2.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg2.owner = 'SDK';
    cg2.type = 'ad-hoc';
    cg2.status = 'submit';

    const cg3: CodeGeneration = new CodeGeneration();
    cg3.name = 'test5c';
    cg3.resourceProvider = 'msi';
    cg3.serviceType = 'resource-manager';
    cg3.resourcesToGenerate = '';
    cg3.tag = null;
    cg3.sdk = 'javascript';
    cg3.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg3.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg3.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg3.owner = 'SDK';
    cg3.type = 'ad-hoc';
    cg3.status = 'completed';

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg1.name);
    await codeGenerationDao.deleteCodeGenerationByName(cg2.name);
    await codeGenerationDao.deleteCodeGenerationByName(cg3.name);
    await codeGenerationDao.submitCodeGeneration(cg1);
    await codeGenerationDao.submitCodeGeneration(cg2);
    await codeGenerationDao.submitCodeGeneration(cg3);

    const retCgs: CodeGeneration[] = await codeGenerationDao.listCodeGenerationsByStatus('completed');
    for (const retCg of retCgs) {
        expect(retCg.status).toBe('completed');
    }

    const retCgs2: CodeGeneration[] = await codeGenerationDao.listCodeGenerationsByStatus(null);
    expect(retCgs2.length).toBe(0);
});

test('dao test submitCodeGeneration and listCodeGenerationsByStatus', async () => {
    const cg1: CodeGeneration = new CodeGeneration();
    cg1.name = 'test6a';
    cg1.resourceProvider = 'msi';
    cg1.serviceType = 'resource-manager';
    cg1.resourcesToGenerate = '';
    cg1.tag = null;
    cg1.sdk = 'javascript';
    cg1.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg1.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg1.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg1.owner = 'SDK';
    cg1.type = 'ad-hoc';
    cg1.status = 'completed';

    const cg2: CodeGeneration = new CodeGeneration();
    cg2.name = 'test6b';
    cg2.resourceProvider = 'msi';
    cg2.serviceType = 'resource-manager';
    cg2.resourcesToGenerate = '';
    cg2.tag = null;
    cg2.sdk = 'javascript';
    cg2.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg2.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg2.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg2.owner = 'SDK';
    cg2.type = 'ad-test';
    cg2.status = 'submit';

    const cg3: CodeGeneration = new CodeGeneration();
    cg3.name = 'test6c';
    cg3.resourceProvider = 'msi';
    cg3.serviceType = 'resource-manager';
    cg3.resourcesToGenerate = '';
    cg3.tag = null;
    cg3.sdk = 'javascript';
    cg3.swaggerRepo = '{"type": "github", "path":"https://github.com/azure"}';
    cg3.sdkRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg3.codegenRepo = '{"type":"github", "path":"https://github.com/azure"}';
    cg3.owner = 'SDK';
    cg3.type = 'ad-test';
    cg3.status = 'pipelineCompleted';

    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    await codeGenerationDao.deleteCodeGenerationByName(cg1.name);
    await codeGenerationDao.deleteCodeGenerationByName(cg2.name);
    await codeGenerationDao.deleteCodeGenerationByName(cg3.name);
    await codeGenerationDao.submitCodeGeneration(cg1);
    await codeGenerationDao.submitCodeGeneration(cg2);
    await codeGenerationDao.submitCodeGeneration(cg3);

    const filters = { type: 'ad-test' };
    const retCgs1: CodeGeneration[] = await codeGenerationDao.listCodeGenerations(filters, true);
    for (const retCg of retCgs1) {
        expect(retCg.type).toBe('ad-test');
    }
    const retCgs2: CodeGeneration[] = await codeGenerationDao.listCodeGenerations(filters, false);
    for (const retCg of retCgs2) {
        expect(retCg.type).toBe('ad-test');
    }
});

test('dao test deleteCodeGenerationByName', async () => {
    const codeGenerationDao = container.get<CodeGenerationDao>(injectableTypes.CodeGenerationDao);
    const mockFn = jest.fn();
    try {
        await codeGenerationDao.deleteCodeGenerationByName('');
        await codeGenerationDao.deleteCodeGenerationByName(undefined);
    } catch (error) {
        mockFn();
    }
    expect(mockFn).toBeCalledTimes(0);
});

function destroyDaoTest() {
    mongoDbConnection.close();
}

afterAll(destroyDaoTest);
