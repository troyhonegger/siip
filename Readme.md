# Secure Internet Identification Protocol
SIIP is a blockchain-based solution for domain name resolution and identity verification. We ([the authors](#Authors)) designed it for our senior design project in spring 2021. All of us are computer science students at Purdue University.

## The Problem
Way back in the days of the dotcom boom, in the infancy of the digital revolution, the world was a more innocent place. Democracy was the central tenet of the web: the idea that you could connect to anyone, _anyone_, in the world with just an IP address was life-changing. The Internet was designed as a global peer-to-peer network: an open, decentralized public space, accessible to everyone and controlled by no one. And under this radically democratic ideal, the web thrived.

Over the years, we've started to lose sight of that dream. All the technology is still there, faster and flashier than ever, but it's begun to consolidate itself under the control of a few large tech companies. There were good reasons for this consolidation: efficiency, security, and abstraction were three key factors. But monopolization of technology is never without its disadvantages, and over the last few years we've started to see some of these disadvantages come to light. Without a means of holding tech superpowers accountable, the internet as a whole is in danger of falling under centralized authority.

Our team asked the question, "how did we get here?" What stands in the way of a truly peer-to-peer internet? We decided that the answer is not Google, Amazon, or Facebook. The most important sources of centralization in the internet today come from two network protocols: DNS and TLS. Think about it: to resolve a URL, you have to make a request to a DNS server. This requires trusting some centralized authority to service your request; if the DNS server is down, or has been compromised, or simply doesn’t approve of your request, it can refuse to answer, or even return the wrong IP address. TLS is even worse: it delegates to a half-dozen certificate authorities the task of deciding whether the entire internet is trustworthy. If a CA chooses to revoke a certificate, you have no way to communicate securely. If anyone compromises a CA, they can issue fraudulent certificates for millions of websites.

## The Solution
Our project is designed to bring us closer to an open internet again, by creating a new, decentralized protocol that can replace DNS servers and TLS certificate authorities. We will implement a blockchain to map IP addresses, DNS namespaces, and TLS public keys. Along with this blockchain, we will create a new internet protocol, called the Secure Internet Identification Protocol (SIIP), whereby clients can query the blockchain to resolve domain names and obtain TLS public keys, all in one step.

This protocol is the perfect application for a blockchain network. Blockchain has gained traction as a system for secure, decentralized consensus, and as such it is ideally suited to this project.

## Documentation
This project uses [Substrate](https://substrate.dev), a modular framework for building highly customizable blockchains. To learn about how Substrate works, visit [https://substrate.dev/](https://substrate.dev/).

## Backlog
See [Product Backlog](./Backlog.md) for the list of user stories

## Authors
The authors of SIIP are:
- Samuel Bove
- Troy Gayman
- Troy Honegger
- Caleb Smith
- Adrian Teigen
