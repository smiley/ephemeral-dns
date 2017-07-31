# Ephemeral DNS

A small, NodeJS-based DNS server that dynamically queries outside sources (cloud providers, dynamic DNS, etc.) on-request to get their up-to-date IP address.

## Experimental warning

This project is a **proof-of-concept** and a **development hack**. It was made to help speed up development around temporary machines (instead of copy-pasting the IP address, or reusing the provider's API library in every language). It **can** and **will** change frequently. Later on, it will be stabilised so it could function as a dnsmasq delegate, but for now it is meant for local development only.

## Why?

I have a project involving Google Cloud, where machines are spun-up, used remotely and terminated briefly. Querying for each machine's IP during the PoC phase required me to manually open the machine in the control panel and grab the IP. I could also use `gcloud compute`, but DNS allowed me to use niftier shortcuts like transparently RDP-ing into a full hostname (e.g.: `hello-world.gcloud.proxy`).

Thus, I looked for small-scale DNS libraries, found [`node-named`](https://github.com/trevoro/node-named) and got to work. It was originally Google Cloud-focused, until I realised I could reuse it for all kinds of dynamic names (DDNS, other cloud providers, VPN-routed hosts, pseudo-names, etc.) and thus it was refactored into supporting multiple providers on multiple "domains".

## Getting started

1. Clone the repository locally
2. `npm install` it
3. Copy `config.json.example` to `config.json` and configure it appropriately:
   * `providers` is an array of provider definitions:
     * `type` corresponds to the class name under `/providers`
     * `params` is a dictionary of named-parameters that are provider-specific. See [the documentation for providers](providers/README.md).
     * `bindDomain` is the DNS-style "parent domain" which will call this provider. For example, a `bindDomain` of "hello.world" will delegate "name.hello.world" to that provider but not "full.name.hello.world" or "hello.world".
4. Run with `npm start`. By default, the server binds to `127.67.76.67` ("127.C.L.D" as in "CLouD"). This can be changed with `npm config set ephemeral-dns:ip 1.2.3.4` or by setting `bindIp` in `config.json`.
5. Set up your actual DNS resolver/proxy to point any DNS requests for your psuedo-domain into this server. Note it **does not** redirect queries for domains it doesn't know of.