import base64
import cryptography
import OpenSSL
import ssl

class SiipCertError(Exception):
    pass

class SiipCertificate:
    def __init__(self, ip, domain, public_key):
        self.ip = ip
        self.domain = domain

        if isinstance(public_key, str):
            self.public_key = bytes.fromhex(public_key.replace(':',''))
        else:
            self.public_key = public_key

    def verify(self, der_cert):
        pem_cert = ssl.DER_cert_to_PEM_cert(der_cert)
        pk = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, pem_cert).get_pubkey().to_cryptography_key()
        pk_str = pk.public_bytes(cryptography.hazmat.primitives._serialization.Encoding.PEM, cryptography.hazmat.primitives._serialization.PublicFormat.SubjectPublicKeyInfo)
        # pk_str will look like
        # b'-----BEGIN PUBLIC KEY-----\n
        #   MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWa0bWGpCinC/A7QIh/nF8dTlyL/r\nrmv4mYE8PJu3M8rsmZPzjSburX/I9wRL9rQGqotM9M0nJkjv3pkAVyptuA==\n
        #   -----END PUBLIC KEY-----\n'
        pk_str_base64 = b''.join(pk_str.splitlines()[1:-1])
        pk_bytes = base64.b64decode(pk_str_base64)
        if self.public_key != pk_bytes:
            raise SiipCertError(f'Invalid SIIP Certificate {self._pk_str(pk_bytes)}')

    def _pk_str(self, s):
        hex_str = s.hex().upper()
        return ':'.join(a + b for a, b in zip(hex_str[::2], hex_str[1::2]))

    def pk_str(self):
        return self._pk_str(self.public_key)

    def __repr__(self):
        return f'SiipCertificate(ip={self.ip}, domain={self.domain}, public_key={self.pk_str()})'
