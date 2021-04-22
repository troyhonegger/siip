#!/usr/bin/python

import socket
import ssl

import httpparse
import siip_resolve

# TODO: websocket support
# TODO if protocol is http, we should allow passing an IP address as hostname.
#   In this case, we should NOT query SIIP. Just connect to the IP address directly
#   Naturally, if protocol is https, this is not allowed, as we have no way to verify the certificate

SSL_CONTEXT = ssl._create_unverified_context()

def get(url, headers, content = None, version = b'HTTP/1.1'):
    return request(b'GET', url, headers, content, version)


class SiipSocketWrapper:
    def __init__(self, full_url, ssl_context = SSL_CONTEXT):
        self.full_url = full_url
        url = httpparse.HttpUrl.parse(full_url)
        # TODO mapping - inconsistent names here. Plus just decide where to pass around an HttpUrl vs bytes
        self.protocol = url.protocol
        self.domain = url.host
        self.port = url.port
        self.url = url.uri
        self.ssl_context = ssl_context

    def __enter__(self):
        self.certificate = siip_resolve.resolve(self.domain.decode())
        self.tcp_socket = None
        self.tls_socket = None

        error = True
        try:
            self.tcp_socket = socket.create_connection((self.certificate.ip, self.port))
            if self.protocol == 'https':
                self.tls_socket = self.ssl_context.wrap_socket(self.tcp_socket, server_hostname=self.domain)
                self.certificate.verify(self.tls_socket.getpeercert(binary_form=True))
            error = False
        finally:
            if error:
                if self.tls_socket is not None:
                    self.tls_socket.close()
                    self.tls_socket = None
                if self.tcp_socket is not None:
                    self.tcp_socket.close()
                    self.tcp_socket = None

        if self.protocol == 'https':
            return self.tls_socket
        else:
            return self.tcp_socket

    def __exit__(self, type, value, traceback):
        if self.tls_socket is not None:
            self.tls_socket.close()
            self.tls_socket = None
        if self.tcp_socket is not None:
            self.tcp_socket.close()
            self.tcp_socket = None

def request(method, url, headers, content = None, version = b'HTTP/1.1', ssl_context = SSL_CONTEXT):
    # note: siip_socket is NOT a SiipSocketWrapper but rather either a TCP or TLS socket, depending on the URL
    with SiipSocketWrapper(url, ssl_context) as siip_socket:
        # grab the actual URI from the URL
        uri = httpparse.HttpUrl.parse(url).uri

        siip_socket.sendall(method + b' ' + uri + b' ' + version + b'\r\n')
        for hdr in headers:
            siip_socket.sendall(hdr + b': ' + headers[hdr] + b'\r\n')
        siip_socket.sendall(b'\r\n')

        if isinstance(content, bytes):
            siip_socket.sendall(content)
        elif content is not None:
            siip_socket.sendall(str(content).encode())

        return httpparse.HttpResponse.parse(siip_socket)

if __name__ == '__main__':
    print(get(b'https://www.google.com', {b'Host': b'www.google.com'}))
