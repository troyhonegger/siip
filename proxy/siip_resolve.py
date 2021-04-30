import sys, os
import redis
import socket
sys.path.append(os.path.join(os.path.dirname(__file__), os.path.pardir, 'client'))
from plow import plow
from siip_certificate import SiipCertificate, decodeCertificate
from register import register
import socket
import ssl
import base64
import OpenSSL

REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_PASSWORD = ""
# TODO: get rid of this global variable
redis_cli = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True)

def resolve(domain):
    try:
        cached = redis_cli.get(f'SIIP:{domain}')
        if cached is not None:
            return decodeCertificate(cached)
    except redis.exceptions.ConnectionError:
        print("Warning: can't connect to redis (for cached SIIP certificates)")


    # TODO: if the blockchain is unreachable, this just hangs forever instead of timing out...
    cert_fields = plow(domain)
    if cert_fields is None:
        return None
    cert_fields = cert_fields.value

    cert = SiipCertificate(
        cert_fields['ip_addr'],
        cert_fields['domain'],
        cert_fields['key']
    )
    try:
        redis_cli.set(f'SIIP:{domain}', cert.encode())
    except redis.exceptions.ConnectionError:
        pass
    return cert

# resolve the domain name using standard DNS
def fallback_resolve(domain):
    try:
        return socket.gethostbyname(domain)
    except OSError:
        return None

def register_certificate(domain, ip, der_cert):
    cert_pem = ssl.DER_cert_to_PEM_cert(der_cert)
    cert_x509 = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert_pem)
    pubkey = OpenSSL.crypto.dump_publickey(OpenSSL.crypto.FILETYPE_PEM, cert_x509.get_pubkey())
    # Parse text of public key
    pubkey = pubkey.decode('utf-8')
    pubkey = pubkey.replace('-----BEGIN PUBLIC KEY-----', '')
    pubkey = pubkey.replace('-----END PUBLIC KEY-----', '')
    pubkey = pubkey.replace('\n', '')
    # Decode from Base64 to Hex
    pubkey = base64.b64decode(pubkey).hex()
    # Insert : every 2 characters
    pubkey = ':'.join(pubkey[i:i+2] for i in range(0, len(pubkey), 2))

    # Save the domain to the blockchain
    # TODO: why won't it accept the public key?
    #register(domain, 'Proxy', ip, '{}', pubkey)
    register(domain, 'Proxy', ip, '{}', '12')
