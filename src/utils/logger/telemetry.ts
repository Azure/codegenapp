import * as statsd from 'hot-shots';

import { config } from '../../config';

const stats = new statsd.StatsD({
    host: config.statsdHost,
    port: config.statsdPort,
    mock: config.env === 'development',
});

export enum Metrics {
    LIVENESS = 'liveness',
    API_CALLS = 'apiCalls',
    INTERNAL_SERVER_ERROR = 'internalServerError',
    BAD_REQUEST = 'badRequest',
    NOT_FOUND = 'notFound',
    SUCCESS = 'success',
}

const nodeName = process.env.NODE_NAME || '';
const podName = process.env.POD_NAME || '';

/**
 * call to emit metrics from the service.
 */
export const emitMetric = (
    metric: Metrics,
    value: number,
    dims?: { [key: string]: string | number }
): void => {
    if (!dims) {
        dims = {};
    }
    dims.env = config.env;
    dims.pod = podName;
    dims.node = nodeName;
    dims.region = config.deploymentRegion;
    // Format must not be changed of the JSON object so it conforms with the Geneva statsd protocol.
    const stat = JSON.stringify({
        Namespace: config.serviceName,
        Metric: metric,
        Dims: dims,
    });
    stats.gauge(stat, value);
};
