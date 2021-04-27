import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), os.path.pardir, 'client'))
from plow import plow
import socket
import ssl
import base64
import OpenSSL

from siip_certificate import SiipCertificate

def resolve(domain):
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
    ip = socket.gethostbyname(domain)

    cert_pem = ssl.get_server_certificate((domain, 443))
    cert_x509 = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert_pem)
    pubkey = OpenSSL.crypto.dump_publickey(OpenSSL.crypto.FILETYPE_PEM, cert_x509.get_pubkey())
    pubkey = pubkey.decode('utf-8')
    pubkey = pubkey.replace('-----BEGIN PUBLIC KEY-----', '')
    pubkey = pubkey.replace('-----END PUBLIC KEY-----', '')
    pubkey = pubkey.replace('\n', '')
    pubkey = base64.b64decode(pubkey).hex()

    return SiipCertificate(
        ip,
        domain,
        pubkey,
    )
