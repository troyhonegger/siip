# User Stories Backlog:

## Classification Key
| Emoji             | Markdown              | Meaning |
| :---------------: | :-------------------- | :------ |
| :warning:         | `:warning:`           | Urgent, critical feature that is a prerequisite to other key features, and must be done as part of the baseline |
| :trophy:          | `:trophy:`            | Very important, high-priority feature |
| :gem:             | `:gem:`               | Important feature that we hope to implement |
| :gift:            | `:gift:`              | Bonus or nice-to-have feature. If it's easy to add, great! If we don't get to it, no big deal |
| :hourglass:       | `:hourglass:`         | Desirable feature, but may not be worth the time required to implement |
| :unicorn:         | `:unicorn:`           | This would be so cool, but it'd be a minor miracle if it actually happened |
| :gear:            | `:gear:`              | A feature that will make development easier |
| :wastebasket:     | `:wastebasket:`       | If we get really desperate for work, we might do this |
| :lock:            | `:lock:`              | Security-critical feature that must be implemented for a robust system |
| :tada:            | `:tada:`              | A feature that will be useful for demonstrations |

## Blockchain Nodes
- [X] :warning: As a security-conscious tech enthusiast, I want to create a full node to run the blockchain
- [ ] :trophy: As a full node just getting started, I should be able to connect to multiple other full nodes on the network, and download/verify the entire block database
- [ ] :trophy: As a full node running the blockchain, I want to send and receive gossip from other nodes about new blocks
- [ ] :gear: As a developer initializing the blockchain, I would like to run a command-line utility that scrapes the web for the most common domain names, gets their IP addresses and digital certificates, and creates SIIP certificates on these users' behalf.
- [X] :tada::gear: As an administrator of a full node, I want a user interface to show me statistics and information about my node
- [ ] :gear: As a developer testing the blockchain, I want to run multiple instances of the blockchain locally, each in a separate container (i.e. via Docker)
- [ ] :gear: As someone setting up my own blockchain or mining agent, I should expect some documentation directing the creation of my architecture.
- [ ] :gift: As someone with a large stake in the SIIP blockchain, I would like the chain to support forkless runtime upgrades that are approved by a vote of nodes (potentially weighted by how many coins each voter has).

## Managing SIIP Certificates
- [X] :warning: As a website owner, I want to register an account on the blockchain, with a public/private key pair. (My public key should be stored on the blockchain)
- [X] :warning: As a website owner, I want to post my server's IP address, domain name, and SSL public key to the blockchain to create an SIIP certificate.
- [X] :trophy: As a website owner, I want all certificate-related transactions to cost something, so no one can spam the chain and potentially buy up my domain.
- [X] :gem: As a website owner, I want to modify my SIIP certificate to change the IP address corresponding to a domain name.
- [X] :gem: As a website owner, I want to modify my SIIP certificate to change the public key corresponding to a domain name.
- [X] :gem: As a website owner, I want to take my website down by revoking my SIIP certificate.
- [ ] :gift: As a website owner, I want to transfer ownership of my certificate to another user. (In this case, the other user, not me, should pay the fee, and both of our signatures should be required)
- [ ] :gift: As a blockchain user who has discovered the private key of an SIIP certificate, I want to revoke the certificate by posting the private key to the blockchain
- [ ] :wastebasket: As a website owner whose certificate has just been revoked, I want my domain name to be reserved for a short time afterward - say, 48 hours - to give me time to create a new certificate. During this time, no one except myself should be able to reserve this domain name
- [ ] :hourglass: As a website owner, I want to assign other owners to share my SIIP certificate. Before making subsequent changes to the certificate (including changes to the owners list), all owners must sign the same transaction

## Economics
Economic structure for baseline blockchain (to be improved upon, time permitting)
- Each transaction costs one coin
- A miner gets one coin per transaction
- No transferring coins. You have to pay to get something done on your behalf
- The number of coins in circulation is fixed

User stories:
- [X] :warning: As a full node running the blockchain server, I want to combine transactions into a block and mine them to add them to the blockchain
- [ ] :trophy: As a miner, I want to receive gossip about unverified transactions, so I can include them in blocks
- [ ] :trophy: As a miner, I want to receive updates from the blockchain when blocks are added, so I don't waste my time trying to add already-mined transactions.
- [X] :trophy: As a miner, I want to be rewarded (in coins) whenever I complete the proof-of-work to validate a block. (My reward should be at least the cost of all transactions in the block, so no coins are lost)
- [ ] :gem: As the owner of a coin, I want to sign another user's transaction to pay for it on their behalf. (Presumably they will pay me in real-world currency for this service)
- [ ] :hourglass: As a resource-constrained miner, I want to mine blocks without running a full node
- [ ] :hourglass: As a resource-constrained miner not running a full node, I should be able to dynamically get a list of full nodes, which will send me gossip about unverified transactions
- [ ] :gift: As a miner, I want to receive an additional reward whenever I complete the proof-of-work to validate a block, on top of the number of coins expended by users on that block. (This additional reward should decrease geometrically w.r.t. time, so the total number of coins in existence does not grow without bound)
- [ ] :gift: As a user, I want to choose how much to pay to make a transaction. The more I pay, the more likely miners are to include my transaction in a block
- [ ] :gift: As a user, I want to make a transaction that transfers coins to another user. (This transaction should require both users' signatures, and per usual a payment from another, possibly different, user)


## Light Clients
- [ ] :trophy: As an end user, I want to perform a host lookup by connecting to a full node over the SIIP protocol (i.e. submit a domain name, get back an IP address and SIIP certificate)
- [ ] :gift: As an end user, I want to perform a reverse lookup by connecting to a full node over the SIIP protocol (i.e. submit an IP address, get back a list of domain names and SIIP certificates)
- [ ] :lock: As an end user, I expect my light node to query multiple full nodes (ideally from a random list), and cross-check the results, so no single node can fool me into accepting a fraudulent certificate
- [ ] :trophy: As an end user, I want to make SIIP queries using a command-line tool, similar to the UNIX "dig" command
- [ ] :gem: As an end user, I want to use a SIIP certificate to connect securely to a server, using a command-line tool similar to the UNIX "curl" command
- [ ] :unicorn: As an end user, I want to use a web browser to browse the internet using SIIP
