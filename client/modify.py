#!/usr/bin/env python3

import sys

if len(sys.argv) != 6:
    print("You must specify all required SIIP certificate fields.")
    print("Usage: modify.py DOMAIN NAME IP_ADDRESS INFO PUBLIC_KEY")
    sys.exit()

domain = sys.argv[1]
name = sys.argv[2]
ip_addr = sys.argv[3]
info = sys.argv[4]
key = sys.argv[5]

# We moved these after the argument check so it fails faster :)
import substrateinterface
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException

substrate = SubstrateInterface(
    url="http://127.0.0.1:9933",
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

keypair = Keypair.create_from_uri('//Alice')
call = substrate.compose_call(
    call_module='SiipModule',
    call_function='modify_certificate',
    call_params={
        'name': name,
        'domain': domain,
        'ip_addr': ip_addr,
        'info': info,
        'key': key,
    }
)
extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)
result = substrate.submit_extrinsic(extrinsic)
print(result)
