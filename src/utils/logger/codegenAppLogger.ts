import * as winston from 'winston';
import { Config } from '../../config/config';
import { Logger } from './logger';
import { Env } from '../../config/environment';
import WinstonDailyRotate = require('winston-daily-rotate-file');

export class CodegenAppLogger implements Logger {
    logger: winston.Logger;

    public constructor(config: Config) {
        const addMeta = winston.format((info) => {
            info.Env = config.env;
            info.Service = config.serviceName;
            return info;
        });

        const consoleTransportOptions: winston.transports.ConsoleTransportOptions = {
            handleExceptions: true,
            level: config.loggingConsoleLevel,
        };

        if (config.env === Env.Development || config.env === Env.Local) {
            consoleTransportOptions.format = winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            );
        }

        this.logger = winston.createLogger({
            level: config.loggingConsoleLevel,
            levels: winston.config.npm.levels,
            exitOnError: false,
            format: winston.format.combine(
                addMeta(),
                winston.format.errors({ stack: true }),
                winston.format.timestamp(),
                winston.format.printf((info) => {
                    const log = {
                        level: info.level,
                        timestamp: info.timestamp,
                        message: info.message,
                    };
                    if (info.stack !== undefined)
                        log['errorStack'] = info.stack;
                    return JSON.stringify(log);
                })
            ),
            transports: [
                new winston.transports.Console(consoleTransportOptions),
                new WinstonDailyRotate({
                    filename: `${config.serviceName}-errors-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD-HH',
                    maxFiles: Number(config.loggingMaxFiles),
                    maxSize: config.loggingMaxFileSize,
                    level: 'error',
                    handleExceptions: true,
                    dirname: 'logs',
                }),
                new WinstonDailyRotate({
                    filename: `${config.serviceName}-combined-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD-HH',
                    maxFiles: Number(config.loggingMaxFiles),
                    maxSize: config.loggingMaxFileSize,
                    level: 'debug',
                    handleExceptions: true,
                    dirname: 'logs',
                }),
            ],
        });
    }

    public error(message: string, meta?: any): void {
        this.logger.error(message, meta);
    }

    public warn(message: string, meta?: any): void {
        this.logger.warn(message, meta);
    }

    public info(message: string, meta?: any): void {
        this.logger.info(message, meta);
    }

    public debug(message: string, meta?: any): void {
        this.logger.debug(message, meta);
    }

    public verbose(message: string, meta?: any): void {
        this.logger.verbose(message, meta);
    }
}
