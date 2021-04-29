#!/usr/bin/python3

import math
import os
import subprocess
import sys
import time
import uuid

import substrateinterface
from substrateinterface import SubstrateInterface
from substrateinterface import Keypair

##########################################################################################
############################## Configuration Constants ##################################
##########################################################################################

# hash rate in hashes per second, for one node. Determined experimentally - will vary by machine
HASH_RATE = 24500
# average number of hashes that a node must try before winning the lottery
DIFFICULTY = 1_000_000
# probability of timing out and assuming the network will never produce a new block
ALPHA = 0.05

# Block production follows exponential distribution with parameter lambda = HASH_RATE/DIFFICULTY
LAMBDA = HASH_RATE / DIFFICULTY
# If random variable T represents time to produce a block, then `Pr[T > x] = e^{-LAMBDA*x}`
# We want this probability to equal ALPHA, so
# `ALPHA = e^{-LAMBDA*x}`, which simplifies to `x = ln(ALPHA)/-LAMBDA`
BLOCK_TIMEOUT = math.log(ALPHA) / -LAMBDA + 1

COLOR_SUCCESS = '\033[32;1m'    # green, bold
COLOR_HIGHLIGHT = '\033[36;1m'  # turquoise, bold
COLOR_RESET = '\033[0m'

ALICE_ACCOUNT_ID = Keypair.create_from_uri('//Alice').ss58_address
BOB_ACCOUNT_ID = Keypair.create_from_uri('//Bob').ss58_address
CHARLIE_KEY = Keypair.create_from_uri('//Charlie')


##########################################################################################
############################## Helper Functions and Classes ##############################
##########################################################################################
class TimeoutError(Exception):
    pass

class Timer:
    def __init__(self, timeout):
        self.timeout = timeout
    def __enter__(self):
        self.start_time = time.time()
        return self
    def check(self):
        if self.start_time + self.timeout < time.time():
            raise TimeoutError('Operation took more than %.1f seconds'%(self.timeout))
    def __exit__(self, _exc_type, _exc_value, _traceback):
        pass

def assert_consensus(alice, bob, domains):
    alice_num_blocks = alice.query('System', 'Number')
    alice_num_blocks = alice_num_blocks.value if alice_num_blocks is not None else 0
    bob_num_blocks = bob.query('System', 'Number')
    bob_num_blocks = bob_num_blocks.value if bob_num_blocks is not None else 0
    assert alice_num_blocks == bob_num_blocks, f'Blockchains out of sync: Alice has {alice_num_blocks} blocks but Bob has {bob_num_blocks}'

    for i in range(alice_num_blocks):
        alice_hash = alice.query('System', 'BlockHash', params=[i]).value
        bob_hash = bob.query('System', 'BlockHash', params=[i]).value
        assert alice_hash == bob_hash, f'Blockchains out of sync at block {i}: Alice has {alice_hash}, but Bob has {bob_hash}'

    for d in domains:
        alice_certificate = alice.query('SiipModule', 'CertificateMap', params=[d])
        bob_certificate = bob.query('SiipModule', 'CertificateMap', params=[d])
        assert (alice_certificate is None and bob_certificate is None) or \
                (alice_certificate is not None and bob_certificate is not None and alice_certificate.value == bob_certificate.value), \
                f'Blockchains out of sync at certificate {d}: Alice has {alice_certificate}, but Bob has {bob_certificate}'

    alice_own_balance = alice.query('System', 'Account', params=[ALICE_ACCOUNT_ID]).value['data']['free']
    bob_own_balance = bob.query('System', 'Account', params=[BOB_ACCOUNT_ID]).value['data']['free']
    alice_bobs_balance = alice.query('System', 'Account', params=[BOB_ACCOUNT_ID]).value['data']['free']
    bob_alices_balance = bob.query('System', 'Account', params=[ALICE_ACCOUNT_ID]).value['data']['free']

    assert alice_own_balance == bob_alices_balance, f'Blockchains are out of sync: Alice claims she has {alice_own_balance} coins, but Bob says she has {bob_alices_balance}'
    assert bob_own_balance == alice_bobs_balance, f'Blockchains are out of sync: Bob claims she has {bob_own_balance} coins, but Alice says he has {alice_bobs_balance}'

def siip_node_connect(port = 9933):
    return SubstrateInterface(
        url=f"http://127.0.0.1:{port}",
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

# register the given domain, and block until it's successfully added to the blockchain.
# It's up to the user to make sure the domain does not already exist
def register_and_wait(substrate, domain):
    call = substrate.compose_call(
        call_module='SiipModule',
        call_function='register_certificate',
        call_params={
            'name': 'John Smith',
            'domain': domain,
            'ip_addr': '10.0.0.1',
            'info': '{}',
            'key': '01:23:45:67:89:AB:CD:EF',
        }
    )
    # This test setup uses Charlie to register all domains
    extrinsic = substrate.create_signed_extrinsic(call=call, keypair=CHARLIE_KEY)
    substrate.submit_extrinsic(extrinsic)
    
    # Note that I think with a websocket connection, you could use 
    # substrate.submit_extrinsic(extrinsic, wait_for_inclusion = True)
    # to block until the extrinsic is included, and eliminate the below code.
    # But websocket support in substrate-interface appears to be unstable, so that's a no go for now
    with Timer(BLOCK_TIMEOUT * 2) as timer: # * 2 is because sometimes it can take up to two blocks for a transaction to get added
        certificate = substrate.query('SiipModule', 'CertificateMap', params=[domain])
        while certificate is None:
            timer.check()
            time.sleep(1)
            certificate = substrate.query('SiipModule', 'CertificateMap', params=[domain])
    return domain

##########################################################################################
############################## Test Code #################################################
##########################################################################################
start_time = time.time()

print(f'{COLOR_HIGHLIGHT}Shutting down existing network to prepare for test:{COLOR_RESET}')
print('$ docker-compose down')
subprocess.run('docker-compose down'.split(), check=True)

print()

print(f'{COLOR_HIGHLIGHT}Starting alice node:{COLOR_RESET}')
print('$ docker-compose up --detach alice')
subprocess.run('docker-compose up --detach alice'.split(), check=True)

print()

# wait for alice to start up
time.sleep(10)

alice = siip_node_connect(9933)


#alice_start_balance = alice.query('System', 'Account', params=[ALICE_ACCOUNT_ID]).value['data']['free']
#bob_start_balance = alice.query('System', 'Account', params=[BOB_ACCOUNT_ID]).value['data']['free']

domain = f'{uuid.uuid4()}.com'
print(f'{COLOR_HIGHLIGHT}Registering {domain}... {COLOR_RESET}')
register_and_wait(alice, domain)

print()

print(f'{COLOR_HIGHLIGHT}Starting bob node:{COLOR_RESET}')
print('$ docker-compose up --detach bob')
subprocess.run('docker-compose up --detach bob'.split(), check=True)

# wait for bob to start up
time.sleep(10)

bob = siip_node_connect(9934)

print()

print(f'{COLOR_HIGHLIGHT}Cross-checking alice and bob for consistency: {COLOR_RESET}', end='')
assert_consensus(alice, bob, [domain])
print('ok')

print()

print(f'{COLOR_HIGHLIGHT}Now verifying that alice and bob both receive transactions and mine blocks:{COLOR_RESET}')
alice_balance = alice.query('System', 'Account', params=[ALICE_ACCOUNT_ID]).value['data']['free']
alice_has_mined = False

bob_balance = alice.query('System', 'Account', params=[BOB_ACCOUNT_ID]).value['data']['free']
bob_has_mined = False
tries = 0
domains = [domain]
while not alice_has_mined or not bob_has_mined:
    tries += 1
    assert tries <= 10, "Either Alice or Bob is mining all the blocks. This indicates transactions are probably not being gossipped properly"

    domain = f'{uuid.uuid4()}.com'
    print(f'Registering {domain}... ', end='', flush=True)
    register_and_wait(alice, domain)
    alice_new_balance = alice.query('System', 'Account', params=[ALICE_ACCOUNT_ID]).value['data']['free']
    bob_new_balance = alice.query('System', 'Account', params=[BOB_ACCOUNT_ID]).value['data']['free']

    # either Alice or Bob should've mined the transaction, and their balance should increase as a result
    assert alice_balance == alice_new_balance or bob_balance == bob_new_balance
    assert alice_balance != alice_new_balance or bob_balance != bob_new_balance

    if alice_balance != alice_new_balance:
        alice_has_mined = True
        alice_balance = alice_new_balance
        print('Mined by Alice')
    else:
        bob_has_mined = True
        bob_balance = bob_new_balance
        print('Mined by Bob')

    domains.append(domain)
    assert_consensus(alice, bob, domains)

print()

print(f'{COLOR_HIGHLIGHT}Shutting down the network:{COLOR_RESET}')
print('$ docker-compose down')
subprocess.run('docker-compose down'.split(), check=True)

print()

print(f'{COLOR_SUCCESS}Success!{COLOR_RESET} Integration test passed in {time.time() - start_time} seconds')
