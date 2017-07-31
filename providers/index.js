var gce = require('./gce.js');

exports.GCEProvider = gce.GCEProvider;

exports.providers = [
    exports.GCEProvider
];