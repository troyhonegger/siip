#!/usr/bin/env python3

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

print(substrate.get_metadata_storage_functions())
