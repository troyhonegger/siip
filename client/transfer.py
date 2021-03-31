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

keypair = Keypair.create_from_uri('//Alice')
call = substrate.compose_call(
    call_module='Balances',
    call_function='transfer',
    call_params={
        'dest': '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL',
        'value': 1 * 10**12
    }
)
extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)
result = substrate.submit_extrinsic(extrinsic)
print(result)
