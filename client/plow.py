#!/usr/bin/env python3

import sys

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("You must specify which domain's SIIP certificate to query for.")
        print("Usage: plow.py DOMAIN [NODE IP(s)...]")
        sys.exit()

# We moved these after the argument check so it fails faster :)
import os.path
import substrateinterface
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException

def plow(domain, node_urls=["http://127.0.0.1:9933"]):
    # XXX
    print(node_urls)
    # For each node_url, call plow_single and collect the returned certificates
    certificates = list(map(lambda url: plow_single(domain, url), node_urls))

    print(certificates[0].value)

    for cert in certificates:
        if cert == None or cert.value != certificates[0].value:
            print("Certificate Mismatch!")
            return None
    
    return certificates[0]

def plow_single(domain, node_url):
    # TODO: validate node_url is formatted correctly?
    substrate = SubstrateInterface(
        url=node_url,
        ss58_format=42,
        type_registry_preset='polkadot',
        type_registry={
            "types": {
                "Certificate": {
                    "type": "struct",
                    "type_mapping": [
                        ["version_number", "i32"],
                        ["owner_id", "AccountId"],
                        ["name", "Vec<u8>"],
                        ["info", "Vec<u8>"],
                        ["key", "Vec<u8>"],
                        ["ip_addr", "Vec<u8>"],
                        ["domain", "Vec<u8>"]
                    ]
                }
            }
        }
    )
    
    return substrate.query('SiipModule', 'CertificateMap', params=[domain])

if __name__ == '__main__':
    domain = sys.argv[1]

    # If IPs were specified on the command line, use those
    if len(sys.argv) > 2:
        node_urls = sys.argv[2:]
        siip = plow(domain, node_urls)
    # If /etc/siip file exists, use those
    elif os.path.exists('/etc/siip'):
        with open('/etc/siip') as file:
            node_urls = file.readlines()
            node_urls = list(map(lambda str: str.rstrip(), node_urls))
        siip = plow(domain, node_urls)
    # Otherwise use the built-in domains
    else:
        siip = plow(domain)

    print(siip)

    if siip is None:
        sys.exit(1)
