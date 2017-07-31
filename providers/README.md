# Lookup providers

"Lookup providers" are resolvers that accept a simplified hostname and return an IP address (only A records/IPv4 at this time). They are most commonly cloud provider interfaces, used to query machines by their instance names.

Any provider has to exist in its own file, follow the spec set by `base.js:LookupProvider` and be manually registered in `index.js`.

## Interface

Any provider must:

- **Inherit** from `LookupProvider` (not enforced)
- **Override** `LookupProvider::processQuery(subname)`, with `subname` being a simplified hostname that doesn't contain any parent/child domains (for example: `"hello-world"`, not `"hello.world"`).
  - Providers are assumed to run asynchronously, and so `processQuery` **must** return a promise, which conforms to this spec:
    - **Hostname exists and has an IP:** `resolve(...)` is called with the IP address as a string
    - **Hostname exists but has no IP:** (powered off, unbound, etc.) `resolve(...)` is called with `"0.0.0.0"`, to allow DNS clients to reject the answer as invalid and try again later.
    - **Hostname does not exist:** `resolve(...)` is called with `null`
    - **Error occurred:** `reject(...)` is called with an exception or an error string
- Be **registered** in `index.js:exports` under their class name and in the list `index.js:exports.providers`.

## Provider list

The current providers are currently implemented:

- [Google Cloud Compute Engine](GCE.js): Looks up virtual machines by-name and returns their first-found external IP. Requires a service account with read permissions. (Barebones permissions supplied in the documentation inside `GCE.js`)
  - Requires several configuration parameters in `config.json`:
    - `projectId`: a Google Cloud project holding these machines. Use the project **id** ("hello-world-123456"), not the user-displayed label/name. ("Hello, World")
    - `keyFilename`: a relative/absolute path to the Google Cloud Service Account's key file used to authenticate and query for machines.