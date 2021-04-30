import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), os.path.pardir, 'client'))
from plow import plow
from register import register
import socket
import ssl
import base64
import OpenSSL

from siip_certificate import SiipCertificate

def resolve(domain):
    # TODO: if the blockchain is unreachable, this just hangs forever instead of timing out...
    cert_fields = plow(domain)
    if cert_fields is None:
        return fallback_resolve(domain)
    cert_fields = cert_fields.value

    return SiipCertificate(
        cert_fields['ip_addr'],
        cert_fields['domain'],
        cert_fields['key']
    )

def fallback_resolve(domain):
    # Get Domain's IP
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
