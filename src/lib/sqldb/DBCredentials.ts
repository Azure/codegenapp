import { ENVKEY } from "../Model";

export interface DBCredential {
  server: string;
  db: string;
  user: string;
  pw: string;
}

let DepthDBCredentials: DBCredential = {
  server: process.env[ENVKEY.ENV_DEPTH_DB_SERVER],
  db: process.env[ENVKEY.ENV_DEPTH_DATABASE],
  user: process.env[ENVKEY.ENV_DEPTH_DB_USER],
  pw: process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD],
};

let CodegenDBCredentials: DBCredential = {
  server: process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
  db: process.env[ENVKEY.ENV_CODEGEN_DATABASE],
  user: process.env[ENVKEY.ENV_CODEGEN_DB_USER],
  pw: process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
};

export { DepthDBCredentials, CodegenDBCredentials };
