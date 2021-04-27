import sys, os
import redis
sys.path.append(os.path.join(os.path.dirname(__file__), os.path.pardir, 'client'))
from plow import plow
from siip_certificate import SiipCertificate, decodeCertificate

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


    cert_fields = plow(domain)
    if cert_fields is None:
        return fallback_resolve(domain)
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

# TODO: resolve the domain name using standard DNS
def fallback_resolve(domain):
    return None