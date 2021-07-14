import { IRepoInfo, RepoInfo } from "../lib/CodeGenerationModel";
import { RepoType, SDK } from "../lib/common";
import { Config } from "./Config";
import { environmentConfigDev } from "./dev";
import { Env } from "./environment";
import { environmentConfigPpe } from "./ppe";
import { environmentConfigProd } from "./prod";
import { configSchema } from "./schema";

const env: Env = configSchema.get("env");

const environmentOverrides = {
  [Env.Production]: environmentConfigProd,
  [Env.Preproduction]: environmentConfigPpe,
  [Env.Development]: environmentConfigDev,
}[env];

configSchema.load(environmentOverrides);
// Perform validation
configSchema.validate({ allowed: "strict" });

export const getGitRepoInfo: IRepoInfo = (repoInfo) => {
  if (repoInfo === undefined || repoInfo === null)
    return { org: undefined, repo: undefined };
  const parts: string[] = repoInfo.path.split("/");
  const len = parts.length;
  if (len <= 2) return { org: undefined, repo: undefined };
  return { org: parts[len - 2], repo: parts[len - 1] };
};

export const config:Config = configSchema.getProperties();