import { Container } from "inversify";
import * as express from "express";
import { InversifyExpressServer } from "inversify-express-utils";
import * as bodyParser from 'body-parser';
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from '@azure/keyvault-secrets';
import { ENVKEY } from "../lib/Model";
import { DepthDBCredentials, CodegenDBCredentials } from "../lib/DBCredentials";

import "../controllers/DepthConverageController"
import "../controllers/CodeGenerateController"
import { PipelineCredential } from "../lib/PipelineCredential";

class CodegenApp {
    private port = this.normalizePort(process.env.PORT || '3000');
    private container: Container;
    // private logger: Logger;
    public async start(): Promise<void> {
        await this.init();
        this.buildContainer();
        this.buildExpress();
    }

    private async init() {
        const credential = new ManagedIdentityCredential();
        const url = process.env["KEYVAULT_URI"] || "https://codegencontrollerkv.vault.azure.net/";
    
        const client = new SecretClient(url, credential);
    
        // let secrets = await client.listPropertiesOfSecrets();
        // for (let secret of secrets) {
    
        // }
    
        try {
            for await (let secretProperties of client.listPropertiesOfSecrets()) {
                console.log("Secret properties: ", secretProperties);
                console.log(secretProperties.name);
                const secret = await client.getSecret(secretProperties.name);
                process.env[secretProperties.name]=secret.value;
            }
    
        } catch(e) {
            console.log("Failed to list key secrets");
            console.log(e);
        }
        
    
        try {
            const secretName = "DepthDBServer";
            const secret = await client.getSecret(secretName);
            process.env[secretName]=secret.value;
        } catch (e) {
            console.log("Failed to get secret");
            console.log(e);
        }

        DepthDBCredentials.server = process.env[ENVKEY.ENV_DEPTH_DB_SERVER];
        DepthDBCredentials.db = process.env[ENVKEY.ENV_DEPTH_DATABASE];
        DepthDBCredentials.user = process.env[ENVKEY.ENV_DEPTH_DB_USER];
        DepthDBCredentials.pw = process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD];
        
        CodegenDBCredentials.server = process.env[ENVKEY.ENV_CODEGEN_DB_SERVER];
        CodegenDBCredentials.db = process.env[ENVKEY.ENV_CODEGEN_DATABASE];
        CodegenDBCredentials.user = process.env[ENVKEY.ENV_CODEGEN_DB_USER];
        CodegenDBCredentials.pw = process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD];

        PipelineCredential.token = process.env[ENVKEY.ENV_REPO_ACCESS_TOKEN];
    }
    private buildContainer(): void {
        this.container = new Container();
    }

    private buildExpress(): void {
        const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
            // this.logger.error("Exception was thrown during request", {
            //     err: serializeError(err),
            //     type: "request",
            //     ..._.pick(req, "path", "method", "body", "hostname", "protocol"),
            //     headers: _.omit(req.headers, "cookie")
            //   });
            //   next(err);
            console.log("Exception was thrown during request")
        };

        const server = new InversifyExpressServer(this.container);

        server.setConfig(app => {
            app.use(
                express.urlencoded({
                extended: true
            }));
            app.use(bodyParser.urlencoded({
                extended: true
              }));
            app.use(bodyParser.json())
            app.use(express.json());

            // app.use("/HelloWorld",)
            
        });
        const serverInstance = server.build();
        serverInstance.listen(3000);
    }

    private normalizePort(val) {
        var port = parseInt(val, 10);
        if (isNaN(port)) {
            return val;
        }

        if (port >= 0) {
            return port;
        }

        return false;
    }

}

export default new CodegenApp();