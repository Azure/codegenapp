import * as retry from 'async-retry';
import * as express from 'express';
import { inject, injectable } from 'inversify';
import * as _ from 'lodash';
import fetch, { RequestInit, Response } from 'node-fetch';
import { PeerCertificate, TLSSocket } from 'node:tls';

import { config } from '../config';
import { Customer } from '../config/config';
import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { Logger } from './logger/logger';

@injectable()
export class AuthUtils {
    @inject(InjectableTypes.Logger) private logger: Logger;

    public async getWhitelistedCerts(
        authMetadataEndpoints: string[]
    ): Promise<string[]> {
        const thumbprints = await Promise.all(
            authMetadataEndpoints.map(async (endpoint) => {
                try {
                    const response = await this.fetchWithRetry(endpoint, {
                        method: 'GET',
                    });
                    if (response && response.status === 200) {
                        const body = await response.json();
                        return body.clientCertificates
                            ? body.clientCertificates.map(
                                  (cert: any) => cert.thumbprint
                              )
                            : [];
                    } else {
                        this.logger.error(
                            `Failed to get metadata from: ${endpoint}, got: ${JSON.stringify(
                                response
                            )}`
                        );
                        return [];
                    }
                } catch (err) {
                    this.logger.error(
                        `Failed to get metadata from: ${endpoint}, got: ${JSON.stringify(
                            err
                        )}`
                    );
                    return [];
                }
            })
        );
        return _.flatten(thumbprints);
    }

    public ensureAuth(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
        customerThumbprints: CustomersThumbprints
    ) {
        if (!req.path.includes(config.healthProbeEndpoint)) {
            const socket: TLSSocket = req.socket as TLSSocket;
            const cert: PeerCertificate = socket.getPeerCertificate();

            if (!cert || !cert.fingerprint) {
                this.logger.warn('Missing client certificate incoming request');
                return res
                    .status(401)
                    .send({ error: 'Client certificate missing' });
            }
            const normalizedFingerprint = cert.fingerprint
                .toUpperCase()
                .replace(/:/g, '');

            let found: boolean = false;
            let customerId: string = '';
            for (let key in customerThumbprints) {
                const fingerprintsToCheck = customerThumbprints[key] || [];
                if (fingerprintsToCheck.includes(normalizedFingerprint)) {
                    customerId = key;
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.logger.warn(
                    `Invalid client certificate for client incoming request ${normalizedFingerprint}.`
                );
                return res.status(401).send({ error: 'Not authorized' });
            }
        }
        next();
    }

    public async getCustomersThumbprints(customers: Customer[]) {
        const customerThumbprintsPairs: ReadonlyArray<[string, string[]]> =
            await Promise.all(
                customers.map(
                    async (c) =>
                        [
                            c.id,
                            [
                                ...c.thumbprints,
                                ...(await this.getWhitelistedCerts(
                                    c.authMetadataEndpoints
                                )),
                            ],
                        ] as [string, string[]]
                )
            );

        return _.fromPairs(customerThumbprintsPairs);
    }

    public async fetchWithRetry(
        url: string,
        init?: RequestInit
    ): Promise<Response> {
        const rawResponse = await retry(
            async (bail, retryNr) => {
                const maskedUrl = url.replace(/api_key=\w+&/, 'api_key=*&');
                this.logger.info(
                    `Executing api call for ${maskedUrl}, retry nr: ${retryNr}`
                );
                const initWithJson: RequestInit = {
                    ...init,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...(init && init.headers),
                    },
                };
                const response = await fetch(url, initWithJson);
                const isLastRetry = retryNr === config.retries + 1;
                if (isLastRetry) {
                    this.logger.error(
                        `Failed REST call for url: ${maskedUrl} after all retries.`
                    );
                }
                if ((!response || response.status > 399) && !isLastRetry) {
                    const responseBody = await response.text();
                    this.logger.warn(
                        `Failed REST call nr ${retryNr} for ${maskedUrl}, response status:${response.status},body:${responseBody}`
                    );
                    throw new Error('Failed rest call');
                }
                return response;
            },
            {
                retries: config.retries,
                factor: 2,
                minTimeout: 1000,
            }
        );

        return rawResponse;
    }
}
export interface CustomersThumbprints {
    [customerId: string]: string[];
}
