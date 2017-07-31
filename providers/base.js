class LookupProvider {
    constructor() {}
    
    processQuery(subname) {
        return new Promise(function (resolve, reject) {
            reject("Not implemented");
        });
    }
}

exports.LookupProvider = LookupProvider;