import { isMainThread } from "worker_threads";
import { CodeGeneration, initService, ENVKEY } from "../src/common";
import { InsertCodeGeneration, getCodeGeneration, DeleteCodeGeneration, UpdateCodeGenerationValue } from "../src/lib/CodeGeneration";
import { AssertionError } from "assert";

var assert = require('assert')
describe('code generation test', () => {
    initService();
    it('ingest an code generation', async () => {
        jest.setTimeout(50000);
        /*insert a code generation. */
        let cg: CodeGeneration = new CodeGeneration("testRP", "terraform", "depth");
        let e = await InsertCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER], process.env[ENVKEY.ENV_CODEGEN_DATABASE], process.env[ENVKEY.ENV_CODEGEN_DB_USER], process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD], cg);
        if (e !== undefined) {
            console.log(e);
        }
        assert.equal(e, undefined);

        /*get a code generation. */
        let {codegen, err} = await getCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER], process.env[ENVKEY.ENV_CODEGEN_DATABASE], process.env[ENVKEY.ENV_CODEGEN_DB_USER], process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD], "testRP", "terraform", "depth");
        assert.equal(err, undefined);
        assert.equal(codegen.resourceProvider, "testRP");
        assert.equal(codegen.sdk, "terraform");
        assert.equal(codegen.type, "depth");

        /* update a code generation. */
        const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER], process.env[ENVKEY.ENV_CODEGEN_DATABASE], process.env[ENVKEY.ENV_CODEGEN_DB_USER], process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD], "testRP", "terraform", "depth", "status", "customizing");
        assert.equal(err, undefined);
        /*check update. */
        let {codegen:updateCodegen, err:updateerr} = await getCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER], process.env[ENVKEY.ENV_CODEGEN_DATABASE], process.env[ENVKEY.ENV_CODEGEN_DB_USER], process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD], "testRP", "terraform", "depth");
        assert.equal(updateerr, undefined);
        assert.equal(updateCodegen.resourceProvider, "testRP");
        assert.equal(updateCodegen.sdk, "terraform");
        assert.equal(updateCodegen.type, "depth");
        assert.equal(updateCodegen.status, "customizing");

        const delret = await DeleteCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER], process.env[ENVKEY.ENV_CODEGEN_DATABASE], process.env[ENVKEY.ENV_CODEGEN_DB_USER], process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD], "testRP", "terraform", "depth");
        assert.equal(delret, undefined);
    });
});