import { config } from '../../config';
import * as statsd from 'hot-shots';

const stats = config.statsdEnable
    ? new statsd.StatsD({
          host: config.statsdHost,
          port: config.statsdPort,
          mock: config.env === 'development',
      })
    : undefined;

export enum Metrics {
    Liveness = 'liveness',
    ApiCalls = 'apiCalls',
    InternalServerError = 'InternalServerError',
    BadRequest = 'BadRequest',
    NotFound = 'NotFound',
    Success = 'success',
}

const nodeName = process.env.NODE_NAME || '';
const podName = process.env.POD_NAME || '';

/**
 * call to emit metrics from the service.
 */
export function emitMetric(metric: Metrics, value: number, dims?: { [key: string]: string | number }): void {
    if (!config.statsdEnable) {
        return;
    }
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
}
