import sys, os
sys.path.append(os.path.join(os.path.pardir, 'client'))
from plow import plow

from siip_certificate import SiipCertificate

def resolve(domain):
    cert_fields = plow(domain)
    if cert_fields is None:
        return fallback_resolve(domain)
    cert_fields = cert_fields.value

    return SiipCertificate(
        cert_fields.ip,
        cert_fields.domain,
        cert_fields.public_key
    )

# TODO: resolve the domain name using standard DNS
def fallback_resolve(domain):
    return None