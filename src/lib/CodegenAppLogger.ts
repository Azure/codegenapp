import * as winston from "winston";
import { Config } from "../config/Config";
import { Environment } from "../config/environment";
// import { default as winstonDailyFile } from "winston-daily-rotate-file";
import { Logger } from "./Logger";
// require('winston-daily-rotate-file')
// import {WinstonDailyRotate}  from 'winston-daily-rotate-file'
import WinstonDailyRotate = require("winston-daily-rotate-file");

export class CodegenAppLogger implements Logger {
  logger: winston.Logger;

  public constructor(config: Config) {
    const addMeta = winston.format((info) => {
      info.Env = config.serviceEnvironment;
      info.Service = config.serviceName;
      return info;
    });

    const consoleTransportOptions: winston.transports.ConsoleTransportOptions = {
      handleExceptions: true,
      level: config.loggingConsoleLevel,
    };

    if (
      config.serviceEnvironment === Environment.Development ||
      config.serviceEnvironment === Environment.Local
    ) {
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
        winston.format.timestamp(),
        winston.format.printf((info) => {
          return JSON.stringify({
            level: info.level,
            timestamp: info.timestamp,
            message: info.message,
          });
        })
      ),
      transports: [
        new winston.transports.Console(consoleTransportOptions),
        new WinstonDailyRotate({
          filename: `${config.serviceName}-errors-%DATE%.log`,
          datePattern: "YYYY-MM-DD-HH",
          maxFiles: Number(config.loggingMaxFiles),
          maxSize: config.loggingMaxFileSize,
          level: "error",
          handleExceptions: true,
          dirname: "logs",
        }),
        new WinstonDailyRotate({
          filename: `${config.serviceName}-combined-%DATE%.log`,
          datePattern: "YYYY-MM-DD-HH",
          maxFiles: Number(config.loggingMaxFiles),
          maxSize: config.loggingMaxFileSize,
          level: "debug",
          handleExceptions: true,
          dirname: "logs",
        }),
        // new winstonDailyFile({
        //   filename: `${config.serviceName}-errors-%DATE%.log`,
        //   datePattern: "YYYY-MM-DD-HH",
        //   maxFiles: Number(config.loggingMaxFiles),
        //   maxSize: config.loggingMaxFileSize,
        //   level: "error",
        //   handleExceptions: true,
        //   dirname: "logs",
        // }),
        // new winstonDailyFile({
        //   filename: `${config.serviceName}-combined-%DATE%.log`,
        //   datePattern: "YYYY-MM-DD-HH",
        //   maxFiles: Number(config.loggingMaxFiles),
        //   maxSize: config.loggingMaxFileSize,
        //   level: "debug",
        //   handleExceptions: true,
        //   dirname: "logs",
        // }),
      ],
    });
  }

  public error(message: string, meta?: any): void {
    this.logger.log("error", message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.logger.log("warn", message, meta);
  }

  public info(message: string, meta?: any): void {
    this.logger.log("info", message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.log("debug", message, meta);
  }

  public verbose(message: string, meta?: any): void {
    this.logger.log("verbose", message, meta);
  }
}
