#!/usr/bin/env python3

import sys

if len(sys.argv) != 2:
    print("You must specify the domain to remove.")
    print("Usage: remove.py DOMAIN")
    sys.exit()

domain = sys.argv[1]

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
    call_function='remove_certificate',
    call_params={
        'domain': domain,
    }
)
extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)
result = substrate.submit_extrinsic(extrinsic)
print(result)
