#!/usr/bin/env python3

import sys

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("You must specify which domain's SIIP certificate to query for.")
        print("Usage: plow.py DOMAIN [NODE IP(s)...]")
        sys.exit()

# We moved these after the argument check so it fails faster :)
import substrateinterface
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException

def plow(domain, node_urls=["http://127.0.0.1:9933"]):
    print(node_urls)
    # TODO: for each, plow_single each url, compare results

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
        siip = plow(domain, sys.argv[2:])
    # TODO else if file /etc/siip exists, use those ips
    # Otherwise use the built-in domains
    else:
        siip = plow(domain)

    print(siip)

    if siip is None:
        sys.exit(1)
