#!/usr/bin/env python3

import substrateinterface
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException

# from scalecodec.type_registry import load_type_registry_preset

#types = SubstrateInterface.load_type_registry_file("types.json")

substrate = SubstrateInterface(
    url="http://127.0.0.1:9933",
    ss58_format=42,
#    type_registry_preset='substrate-node-template', #72
#    type_registry_preset='default', #80
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

# thought this might fix the decoding exception
#substrate.reload_type_registry()

#keypair = Keypair.create_from_uri('//Alice')
# SiipModule.Certificate
# State.GetStorage
# State.getStorage
# System.Certificate
#print(substrate.get_metadata_storage_functions())
siip = substrate.query('SiipModule', 'CertificateMap', params=['test.com'])
print(siip)
