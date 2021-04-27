import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), os.path.pardir, 'client'))
from plow import plow
import socket

from siip_certificate import SiipCertificate

def resolve(domain):
    cert_fields = plow(domain)
    print(cert_fields)
    if cert_fields is None:
        return fallback_resolve(domain)
    cert_fields = cert_fields.value

    return SiipCertificate(
        cert_fields['ip_addr'],
        cert_fields['domain'],
        cert_fields['key']
    )

# TODO: resolve the domain name using standard DNS
def fallback_resolve(domain):
    return SiipCertificate(
        socket.gethostbyname(domain),
        domain,
        "12:34",
    )
