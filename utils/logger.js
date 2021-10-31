const {createLogger, format, transports} = require("winston");
const {printf, timestamp, prettyPrint, colorize, errors, combine, json, label, metadata, simple} = format;
const publicIp = require('public-ip');
const path = require("path");
const LEVEL = Symbol.for('level');
const errorLog = path.join(__dirname, '../logs/error.log');
const allLog = path.join(__dirname, '../logs/all.log');
const myFormat = printf(async ({level, message, timestamp, label, ip }) => {
    return `[${label}] | ${level}: ${message} ${timestamp} | ip: ${ip}`;
});
function filterOnly(level) {
    return format(function (info) {
        if (info[LEVEL] === level) {
            return info;
        }
    })();
}
const Logger = (path, method) => {
    const logger = createLogger({
        format: combine(
            label({label: `Method: ${method} | Path: ${path}`}),
            metadata({fillExcept: ['message', 'level', 'timestamp', 'label', 'ip']}),
            timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            json(),
            myFormat,
            prettyPrint(),
            errors({stack: true}),
        ),
        transports: [
            new transports.File({filename: allLog, level: 'info', format: filterOnly('info')}),
            new transports.File({filename: errorLog, level: 'error'}),
        ],
    });


    if (process.env.NODE_ENV !== 'prod') {
        logger.add(new transports.Console({
            format: combine(colorize({level: true}), simple()),
        }));
    }
    return logger;
}
const logInfo = async (path, method, message, meta) => Logger(path, method).info(message, {ip: await publicIp.v4(), ...meta})
const logError = async (path, method, message, meta) => Logger(path, method).error(message, {ip: await publicIp.v4(), ...meta})


module.exports = {logInfo, logError};