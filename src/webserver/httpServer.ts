import * as express from "express";
import https = require("https");
import http = require("http");
import { logger } from "../lib/util";
import * as fs from "fs";
import * as tls from "tls";
import { config } from "../config";
export function getHttpsServer(app: any | express.Application) {
  console.log(__dirname);
  //   const certs = {
  //     "127.0.0.1": {
  //       key: "D:\\project\\codegenapp\\.ssh\\127-0-0-1-ca.pem",
  //       cert: "D:\\project\\codegenapp\\.ssh\\127-0-0-1-ca.cer",
  //     },
  //     localhost: {
  //       key: "D:\\project\\codegenapp\\.ssh\\localhost-ca.pem",
  //       cert: "D:\\project\\codegenapp\\.ssh\\localhost-ca.crt",
  //     },
  //     "login.microsoftonline.com": {
  //       // key: 'D:\\project\\codegenapp\\.ssh\\login-microsoftonline-com-ca.pem',
  //       cert: "D:\\project\\codegenapp\\.ssh\\login-microsoftonline-com-ca.crt",
  //     },
  //   };
  // const secureContexts = getSecureContexts(certs)
  // const options = {
  //     // A function that will be called if the client supports SNI TLS extension.
  //     SNICallback: (servername: any, cb: any) => {
  //         const ctx = secureContexts[servername]

  //         if (!ctx) {
  //             logger.error('Not found SSL certificate for host: ' + servername)
  //         } else {
  //             logger.info('SSL certificate has been found and assigned to ' + servername)
  //         }

  //         if (cb) {
  //             cb(null, ctx)
  //         } else {
  //             return ctx
  //         }
  //     }
  // }
  try {
    let key;
    let cert;
    try {
      logger.error(
        "keypath:" + config.certKeyPath + ", certpath:" + config.certPemPath
      );
      console.log(
        "keypath:" + config.certKeyPath + ", certpath:" + config.certPemPath
      );
      key = fs.readFileSync(config.certKeyPath);
      cert = fs.readFileSync(config.certPemPath);
    } catch (e) {
      logger.error("Failed to get certs. Trying the legacy certs location");
      //   key = fs.readFileSync(config.legacyCertKeyPath);
      //   cert = fs.readFileSync(config.legacyCertPemPath);
    }
    const options: https.ServerOptions = {
      key,
      cert,
      requestCert: true,
      rejectUnauthorized: false,
      //   honorCipherOrder: true,
      //   secureProtocol: "TLSv1_2_method",
      //   ciphers: config.ciphers,
    };
    const httpsServer = https.createServer(options, app);
    return httpsServer;
  } catch (e) {
    logger.error(`Failed to create httpsServer ${e}`);
  }
  return undefined;
}

export function getHttpServer(app: any | express.Application) {
  return http.createServer(app);
}

function getSecureContexts(certs: any) {
  if (!certs || Object.keys(certs).length === 0) {
    throw new Error("Any certificate wasn't found.");
  }

  const certsToReturn: any = {};

  for (const serverName of Object.keys(certs)) {
    const appCert = certs[serverName];

    certsToReturn[serverName] = tls.createSecureContext({
      key: fs.readFileSync(appCert.key),
      cert: fs.readFileSync(appCert.cert),
    });
  }
  return certsToReturn;
}
