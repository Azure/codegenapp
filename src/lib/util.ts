import * as retry from "async-retry";
import fetch, { RequestInit, Response } from "node-fetch";
import * as URL from "url";
import { config } from "../config";
import { CodegenAppLogger } from "./CodegenAppLogger";

export const logger = new CodegenAppLogger(config);
export const callWithRetry = async <T, U, V extends any[]>(
  fn: (this: U | undefined, ...args: V) => Promise<T> | T,
  args: V,
  thisBinding?: U,
  overrideName?: string
): Promise<T | undefined> => {
  const name = overrideName || fn.name;
  const finalResult = await retry(
    async (bail, retryNr) => {
      logger.info(
        `Executing for : ${name} and args: ${JSON.stringify(
          args
        )}, retry nr: ${retryNr}`
      );

      try {
        const result = await fn.apply(thisBinding, args);
        //   emitMetric(Metrics.DEPENDENCY_CALLS, 1, {
        //     type: name,
        //     status: "SUCCESS",
        //   });
        return result;
      } catch {
        const isLastRetry = retryNr === config.retries + 1;
        logger.warn(`Failed dependency call nr ${retryNr} for ${name}`);
        if (isLastRetry) {
          logger.error(`Failed dependency call for ${name} after all retries.`);
          // emitMetric(Metrics.DEPENDENCY_CALLS, 1, {
          //   type: name,
          //   status: "FAIL",
          // });
        } else {
          throw new Error("Failed call");
        }
      }
    },
    {
      retries: config.retries,
      factor: 2,
      minTimeout: 1000,
    }
  );
  return finalResult;
};

/**
 * fetch with retry logic
 */
export const fetchWithRetry = async (
  url: string,
  init?: RequestInit
): Promise<Response> => {
  const rawResponse = await retry(
    async (bail, retryNr) => {
      const maskedUrl = url.replace(/api_key=\w+&/, "api_key=*&");
      logger.info(`Executing api call for ${maskedUrl}, retry nr: ${retryNr}`);
      const initWithJson: RequestInit = {
        ...init,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(init && init.headers),
        },
      };
      const response = await fetch(url, initWithJson);
      const isLastRetry = retryNr === config.retries + 1;
      if (isLastRetry) {
        logger.error(
          `Failed REST call for url: ${maskedUrl} after all retries.`
        );
      }
      if ((!response || response.status > 399) && !isLastRetry) {
        const responseBody = await response.text();
        logger.warn(
          `Failed REST call nr ${retryNr} for ${maskedUrl}, response status:${response.status},body:${responseBody}`
        );
        throw new Error("Failed rest call");
      }
      return response;
    },
    {
      retries: config.retries,
      factor: 2,
      minTimeout: 1000,
    }
  );
  // emitMetric(Metrics.DEPENDENCY_CALLS, 1, {
  //   type: URL.parse(url).host || "externalUrl",
  //   status: ((rawResponse && rawResponse.status) || 500).toString(),
  // });

  return rawResponse;
};
