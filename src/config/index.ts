import { Config } from './config';
import { environmentConfigDev } from './dev';
import { Env } from './environment';
import { environmentConfigPpe } from './ppe';
import { environmentConfigProd } from './prod';
import { configSchema } from './schema';

const env: Env = configSchema.get('env');

const environmentOverrides = {
    [Env.Production]: environmentConfigProd,
    [Env.Preproduction]: environmentConfigPpe,
    [Env.Development]: environmentConfigDev,
}[env];

configSchema.load(environmentOverrides);
// Perform validation
configSchema.validate({ allowed: 'strict' });

export const config: Config = configSchema.getProperties();
