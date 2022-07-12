const winston = require('winston');

export interface Logger {
    // @ts-ignore
    logger: winston.Logger;
    error: (string, any?) => void;
    warn: (string, any?) => void;
    info: (string, any?) => void;
    debug: (string, any?) => void;
    verbose: (string, any?) => void;
}
