# Secure Internet Identification Protocol
SIIP is a blockchain-based solution for domain name resolution and identity verification. We ([the authors](#Authors)) designed it for our senior design project in spring 2021. All of us are computer science students at Purdue University.

## High-Level Design
There are two centralized protocols deep within the foundations of the web: DNS name resolution and TLS certificate verification. We designed SIIP to replace both of these protocols with a decentralized solution.

### The Problem
Way back in the days of the dotcom boom, in the infancy of the digital revolution, the web was a more innocent place. Democracy was its central tenet: the idea that you could connect to anyone, _anyone_, in the world with just an IP address was life-changing. The Internet was designed as a global peer-to-peer network: an open, decentralized public space, accessible to everyone and controlled by no one. And under this radically democratic ideal, the web thrived.

Over the years, we've started to lose sight of that dream. All the technology is still there, faster and flashier than ever, but it's begun to consolidate itself under the control of a few large tech companies. There were good reasons for this consolidation: efficiency, security, and abstraction were three key factors. But monopolization of technology is never without its disadvantages, and over the last few years we've started to see some of these disadvantages come to light. Without a means of holding tech superpowers accountable, the internet as a whole is in danger of falling under centralized authority.

### Centralization Deep Within the Web
Our team asked the question, "how did we get here?" What stands in the way of a truly peer-to-peer internet? We decided that the answer is not Google, Amazon, or Facebook. The most important sources of centralization in the internet today come from two network protocols: DNS and TLS.

To resolve a URL, you have to make a request to a DNS server. This requires trusting some centralized authority to keep track of who owns which domain. If your DNS server is down, or has been compromised, or simply doesn’t approve of your request, it can refuse to answer, or even return the wrong IP address.

TLS is even worse: it delegates to a half-dozen certificate authorities the task of deciding whether the entire internet is trustworthy. If you're a website owner, and a CA chooses to revoke your certificate, you have no way to communicate securely. If someone convinces a CA to sign a fraudulent certificate for your domain, they can use that certificate to steal your "online identity," and convince others to communicate with them instead of you. And worst of all, if anyone compromises a CA, they can issue fraudulent certificates for millions of websites.

### Our Solution
Our project is designed to bring us back to an open internet, by creating a new, decentralized protocol that can replace DNS servers and TLS certificate authorities. We've implemented a blockchain to map IP addresses, DNS namespaces, and TLS public keys. Along with this blockchain, we've created a new protocol, called the Secure Internet Identification Protocol (SIIP), whereby clients can query the blockchain to resolve domain names and obtain TLS public keys, all in one step.

When a client wants to connect to a server (say, for example, google.com), it will first reach out a blockchain node, and obtain google.com's SIIP certificate. That certificate will contain Google's IP address, as well as its TLS public key. It can then directly connect to that IP address, using the public key for the TLS handshake. It doesn't need to check the signature on the server's certificate; it just needs to make sure the public key matches what it received from the blockchain.

To make the protocol trustless and secure, we've built it on top of a blockchain. Blockchain has gained traction as a system for secure, decentralized consensus, and as such it is ideally suited to this project. Blockchains are completely transparent yet completely unforgeable. No attacker can modify your certificate or issue a new one for your domain, unless it has your private key. And due to the structure of the blockchain, it's impossible for a node on the blockchain to modify its data without detection. This means the client doesn't have to trust anyone; not even the servers running the blockchain itself. As long as no single entity controls over half the network, no one will be able to convince a client to accept a fraudulent certificate.

## How it works

#### Blockchain architecture: Substrate
Our blockchain is based on [Substrate](https://substrate.dev), a modular framework for building highly customizable blockchains. To learn about how Substrate works, visit [https://substrate.dev/](https://substrate.dev/).

The economics of the chain are fairly simple. Our chain uses a proof-of-work algorithm to mine and import blocks, just like Bitcoin does. There are no special "validator" nodes - anyone can start a node and run the blockchain ledger, and anyone can mine blocks. Anyone who wants to submit a transaction (for example, to register a certificate) must pay one coin, plus an optional tip. The miner who mines a block gets a reward equal to the sum of all coins spent in that block, plus an additional, geometrically decreasing, reward. The additional reward prevents a single miner from amassing all the currency simply by never spending anything; and the geometrically decreasing schedule prevents the amount of currency from growing without bound. The presence of a tip allows the currency to be effectively self-regulating. Miners can pick which transactions to include in blocks*, and they will be incentivized to mine only the transactions with the highest tips. So by supply-and-demand, anyone submitting transactions will be effectively forced to pay the going rate if they want their transactions to be included.

\* Note that our mining implementation does not currently allow prioritizing transactions. We didn't implement this feature due to time constraints; however, anyone starting a mining node is free to add this functionality themselves, and should do so in order to maximize their rewards.

#### Browsing via SIIP
Browsing the web using the SIIP protocol natively would require browser support. We looked into forking a web browser and adding logic for SIIP-based domain resolution and TLS handshaking, but ultimately decided that would be out-of-scope for a one-semester project. Instead, we decided to implement a proxy to perform the custom SIIP handshake. To browse the web via SIIP, a client can simply connect to the proxy via standard HTTPS. The proxy uses a self-signed certificate to connect to the client, and uses SIIP to resolve domain names and perform TLS handshakes. The browser should import the proxy's certificate and add it to its list of trusted certificates. For best results, the proxy's certificate should be the only certificate in the browser's list (this prevents the client from connecting to anything that's not the proxy, thus bypassing the SIIP protocol).

## Backlog
See [Product Backlog](./Backlog.md) for the list of user stories.

## Authors
The authors of SIIP are:
- Samuel Bove
- Troy Gayman
- Troy Honegger
- Caleb Smith
- Adrian Teigen
