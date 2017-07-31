var named = require('node-named');
var format = require('string-format');
var fs = require('fs');
var process = require('process');
format.extend(String.prototype);

var providers = require('./providers');
var utils = require('./utils');

var server = named.createServer();
var ttl = 300;
const REGEXP_FORMAT_STRING = '^([^\\.]*)\\.{0}$';
const DEFAULT_BIND_IP = process.env.npm_package_config_ip;

var settings = null;
try {
    settings = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
} catch (ex) {
    throw Error("No configuration file present.");
}

if (settings.providers == undefined) {
    throw Error('Providers undefined; if you wish to use zero providers (why?), supply an empty array.');
}

if (settings.bindIp == undefined) {
    // "127.G.G.L" (GooGLe)
    settings.bindIp = DEFAULT_BIND_IP;
}

if (settings.debug == undefined) {
    settings.debug = process.env.npm_package_config_debug;
}
process.env.npm_package_config_debug = settings.debug;

const logger = utils.createLogger('main');

var dgram = require('dgram');
// TODO: Work around a bug with "node-named".
var _oldCS = dgram.createSocket;
dgram.createSocket = function() {
    if (typeof arguments[0] === 'object') {
        if (arguments[0].type == 'udp6') {
            arguments[0].type = 'udp4';
        }
    } else if (typeof arguments[0] === 'string') {
        if (arguments[0] == 'udp6') {
            arguments[0] = 'udp4';
        }
    }
    
    return _oldCS.apply(this, arguments);
}

var PROVIDERS = [];

for (var i = 0; i < settings.providers.length; i++) {
    var cfg = settings.providers[i];
    var instance = new providers[cfg.type](cfg.params);
    var re_matcher = new RegExp(REGEXP_FORMAT_STRING.format(cfg.bindDomain.replace('.', '\\.')), 'i');
    PROVIDERS.push({
        type: cfg.type,
        provider: instance,
        matcher: re_matcher
    });
}

function getProviderForQuery(query) {
    for (var i = 0; i < PROVIDERS.length; i++) {
        var provider = PROVIDERS[i];
        var info = provider.matcher.exec(query);
        if (info != null) {
            return {
                type: provider.type,
                provider: provider.provider,
                name: info[1]
            }
        }
    }
    
    return null;
}

server.listen(53, settings.bindIp, function() {
    logger.info('DNS server started on %s:53', settings.bindIp);
});

server.on('query', function(query) {
    var domain = query.name();
    var type = query.type();
    var txnId = utils.randomInt(1000, 10000);
    
    logger.info('[%d] DNS Query: %s (%s)', txnId, domain, type);

    switch (type) {
    case 'A':
        var data = getProviderForQuery(domain);
        if (data != null) {
            logger.debug('Querying for machine named "%s", asking %s...', data.name, data.type);
            data.provider.processQuery(data.name).then(
            function(ip) {
                if (ip != null) {
                    var record = new named.ARecord(ip);
                    query.addAnswer(domain, record, 300);
                    logger.info('[%d] DNS Response: %s', txnId, ip);
                } else {
                    query._flags.rcode = named.Protocol.DNS_ENONAME;
                    logger.info('[%d] DNS Response: NXDomain', txnId);
                }
                query.respond();
            },
            function(err) {
                logger.error('Provider returned error: %s', err);
                logger.warn('[%d] DNS Response: ServFail', txnId);
                query._flags.rcode = named.Protocol.DNS_ESERVER;
                query.respond();
            });
        } else {
            logger.warn('[%d] DNS Response: NXDomain', txnId);
            query._flags.rcode = DNS_ENONAME;
            query.respond();
        }
        break;
    default:
        logger.warn('[%d] Unsupported type: %s', txnId, type);
        logger.warn('[%d] DNS Response: NXDomain', txnId);
        query._flags.rcode = named.Protocol.DNS_ENONAME;
        query.respond();
    }
});

server.on('clientError', function(error) {
    logger.error("there was a clientError: %s", error);
});

server.on('uncaughtException', function(error) {
    logger.error("there was an excepton: %s", error.message);
});