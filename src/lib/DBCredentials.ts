import { ENVKEY } from "./Model";

let DepthDBCredentials = {
  server: process.env[ENVKEY.ENV_DEPTH_DB_SERVER],
  db: process.env[ENVKEY.ENV_DEPTH_DATABASE],
  user: process.env[ENVKEY.ENV_DEPTH_DB_USER],
  pw: process.env[ENVKEY.ENV_DEPTH_DB_PASSWORD],
};

let CodegenDBCredentials = {
  server: process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
  db: process.env[ENVKEY.ENV_CODEGEN_DATABASE],
  user: process.env[ENVKEY.ENV_CODEGEN_DB_USER],
  pw: process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
};

export { DepthDBCredentials, CodegenDBCredentials };
