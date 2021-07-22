import { config } from "../config";
import { fetchWithRetry, logger } from "./util";
import * as express from "express";
import * as _ from "lodash";
// import * as tls from "tls";
import { Customer } from "../config/Config";
import { PeerCertificate, TLSSocket } from "node:tls";

/**
 * Get Whitelist certs
 */
export const getWhitelistedCerts = async (
  authMetadataEndpoints: string[]
): Promise<string[]> => {
  const thumbprints = await Promise.all(
    authMetadataEndpoints.map(async (endpoint) => {
      try {
        const response = await fetchWithRetry(endpoint, { method: "GET" });
        if (response && response.status === 200) {
          const body = await response.json();
          return body.clientCertificates
            ? body.clientCertificates.map((cert: any) => cert.thumbprint)
            : [];
        } else {
          logger.error(
            `Failed to get metadata from: ${endpoint}, got: ${JSON.stringify(
              response
            )}`
          );
          return [];
        }
      } catch (err) {
        logger.error(
          `Failed to get metadata from: ${endpoint}, got: ${JSON.stringify(
            err
          )}`
        );
        return [];
      }
    })
  );
  return _.flatten(thumbprints);
};

/**
 * Ensures client certificate is present and whitelisted.
 */
export const ensureAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
  customerThumbprints: CustomersThumbprints
) => {
  if (!req.path.includes(config.healthProbeEndpoint)) {
    const socket: TLSSocket = req.socket as TLSSocket;
    const cert: PeerCertificate = socket.getPeerCertificate();

    if (!cert || !cert.fingerprint) {
      logger.warn("Missing client certificate incoming request");
      return res.status(401).send({ error: "Client certificate missing" });
    }
    const normalizedFingerprint = cert.fingerprint
      .toUpperCase()
      .replace(/:/g, "");

    // // regex for path from swagger.

    // const match = req.path.match("customers/([a-zA-Z0-9-_]+)/.*");
    // const customerId = match ? match[1] : "";
    // const fingerprintsToCheck = customerThumbprints[customerId] || [];

    // if (!fingerprintsToCheck.includes(normalizedFingerprint)) {
    //   logger.warn(
    //     `Invalid client certificate for client incoming request ${normalizedFingerprint}. Accepted fingerprints are: ${fingerprintsToCheck}. ClientId: ${customerId}.`
    //   );
    //   return res.status(401).send({ error: "Not authorized" });
    // }
    let found: boolean = false;
    let customerId: string = "";
    for (let key in customerThumbprints) {
      const fingerprintsToCheck = customerThumbprints[key] || [];
      if (fingerprintsToCheck.includes(normalizedFingerprint)) {
        customerId = key;
        found = true;
        break;
      }
    }
    if (!found) {
      logger.warn(
        `Invalid client certificate for client incoming request ${normalizedFingerprint}.`
      );
      return res.status(401).send({ error: "Not authorized" });
    }
  }
  next();
};

export const getCustomersThumbprints = async (customers: Customer[]) => {
  const customerThumbprintsPairs: ReadonlyArray<
    [string, string[]]
  > = await Promise.all(
    customers.map(
      async (c) =>
        [
          c.id,
          [
            ...c.thumbprints,
            ...(await getWhitelistedCerts(c.authMetadataEndpoints)),
          ],
        ] as [string, string[]]
    )
  );

  return _.fromPairs(customerThumbprintsPairs);
};

export interface CustomersThumbprints {
  [customerId: string]: string[];
}
