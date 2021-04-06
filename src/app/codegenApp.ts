import { Container } from "inversify";
import * as express from "express";
import { InversifyExpressServer } from "inversify-express-utils";
import * as bodyParser from 'body-parser';
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from '@azure/keyvault-secrets';

import "../controllers/depthConverageController"

class CodegenApp {
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
            app.use(express.json());

            // app.use("/HelloWorld",)
            
        });
        const serverInstance = server.build();
        serverInstance.listen(3000);
    }

}

export default new CodegenApp();