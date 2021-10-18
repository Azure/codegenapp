import { Config } from './config';
import { environmentConfigDev } from './dev';
import { Env } from './environment';
import { environmentConfigPpe } from './ppe';
import { environmentConfigProd } from './prod';
import { configSchema } from './schema';
import { environmentConfigTest } from './test';

const env: Env = configSchema.get('env');

const environmentOverrides = {
    [Env.Production]: environmentConfigProd,
    [Env.Preproduction]: environmentConfigPpe,
    [Env.Development]: environmentConfigDev,
    [Env.Test]: environmentConfigTest,
}[env];

configSchema.load(environmentOverrides);
// Perform validation
configSchema.validate({ allowed: 'strict' });

export const config: Config = configSchema.getProperties();
