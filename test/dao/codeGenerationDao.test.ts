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

test('dao test submitCodeGeneration and getCodeGenerationByName', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test1';
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

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName('test1');
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBe(null);
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SDK');
    expect(retCg.type).toBe('ad-hoc');
    expect(retCg.status).toBe('submit');
});

test('dao test submitCodeGeneration, updateCodeGenerationValueByName and getCodeGenerationByName', async () => {
    const cg: CodeGeneration = new CodeGeneration();
    cg.name = 'test2';
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
    await codeGenerationDao.updateCodeGenerationValueByName('test2', 'owner', 'SWG');

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName('test2');
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBe(null);
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
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

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName('test3');
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBe(null);
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SDK');
    expect(retCg.type).toBe('ad-hoc');
    expect(retCg.status).toBe('submit');

    await codeGenerationDao.deleteCodeGenerationByName('test3');
    const reqCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName('test3');
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
    await codeGenerationDao.updateCodeGenerationValuesByName('test4', { type: 'ad-real', status: 'del' });

    const retCg: CodeGeneration = await codeGenerationDao.getCodeGenerationByName('test4');
    expect(retCg.resourceProvider).toBe('msi');
    expect(retCg.serviceType).toBe('resource-manager');
    expect(retCg.tag).toBe(null);
    expect(retCg.sdk).toBe('javascript');
    expect(retCg.swaggerRepo).toBe('{"type": "github", "path":"https://github.com/azure"}');
    expect(retCg.owner).toBe('SDK');
    expect(retCg.type).toBe('ad-real');
    expect(retCg.status).toBe('del');
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

function destroyDaoTest() {
    mongoDbConnection.close();
}

afterAll(destroyDaoTest);
