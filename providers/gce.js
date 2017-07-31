var gcloud = require('google-cloud');

var base = require('./base.js');

function getExternalIpForVm(vm) {
    for (var i = 0; i < vm.metadata.networkInterfaces.length; i++) {
        var iface = vm.metadata.networkInterfaces[i];
        for (var j = 0; j < iface.accessConfigs.length; j++) {
            var accesscfg = iface.accessConfigs[j];
            if (accesscfg.type == 'ONE_TO_ONE_NAT') {
                return accesscfg.natIP;
            }
        }
    }
    
    return null;
}   

class GCEProvider extends base.LookupProvider {
    constructor(projectId, keyFilename) {
        super();
        if (typeof projectId === "object") {
            var settings = projectId;
            projectId = settings.projectId;
            keyFilename = settings.keyFilename;
        }
        
        this.gcloud = gcloud({
            projectId: projectId,
            keyFilename: keyFilename,
        });
        
        this.compute = this.gcloud.compute();
    }
    
    processQuery(subname) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.compute.getVMs({filter: 'name eq "{0}"'.format(subname), maxResults: 1}, function(err, vms) {
                if (err != null) {
                    console.error('Google Cloud returned error: %s', err);
                    reject(err);
                    return;
                }
                console.log('Google Cloud answered with %d VMs', vms.length, err);
                
                var externalIP = null;
                for (var i = 0; i < vms.length; i++) {
                    var vm = vms[i];
                    if (vm.name.toLowerCase() == subname) {
                        console.log('Found VM "%s"', vm.name);
                        // This is the VM!
                        externalIP = getExternalIpForVm(vm);
                        if (externalIP != null) {
                            console.log('VM has external IP: %s', externalIP);
                        } else {
                            console.log('VM has NO external IP (but does exist)');
                            externalIP = '0.0.0.0';
                        }
                        break;
                    }
                }
                resolve(externalIP);
            });
        });
    }
}

exports.GCEProvider = GCEProvider;