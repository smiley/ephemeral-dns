var process = require('process');
var winston = require('winston');

winston.setLevels({
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
});

winston.config.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    debug: 'green'
});

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

exports.randomInt = randomInt;

function createLogger(name) {
    var transports = [];
    if (process.env.npm_package_config_debug) {
        transports = [
            new winston.transports.Console({
                humanReadableUnhandledException: true
            })
        ];
    }
    
    var logger = new winston.Logger({
        id: name,
        level: 'debug',
        transports: transports,
        timestamp: true,
        colorize: true,
        prettyPrint: true,
        silent: false
    });
    
    return logger;
}

exports.createLogger = createLogger;