#!/usr/bin/python3

import os
import OpenSSL
import select
import socket
import socketserver
import ssl
import uuid

import httpparse
import siip_certificate
import siip_requests
import siip_resolve

STATE_START = 0
STATE_RCVHDRS = 1
STATE_RCVBODY = 2
STATE_DONE = 3

LOG = True

SSL_PROXY_CONTEXT = ssl._create_unverified_context()

ssl_sk = None
ssl_cert = None
with open('domain.key', 'rb') as sk_file:
    ssl_sk = OpenSSL.crypto.load_privatekey(OpenSSL.crypto.FILETYPE_PEM, sk_file.read())
with open('domain.crt', 'rb') as cert_file:
    ssl_cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert_file.read())

class ProxyHandler(socketserver.BaseRequestHandler):
    def handle_tunnel(self):
        url = httpparse.HttpUrl.parse(self.http_request.url)

        #TODO: there are two errors that could occur here.
        # 1. Resolution fails because the domain does not exist
            # Must throw an error (404 or similar)
        # 2. Resolution fails because the domain is not on SIIP
            # Should resolve and connect using existing DNS/HTTPS. This may be complicated
            # If configured, should also add certificate to blockchain
        certificate = siip_resolve.resolve(url.host.decode())
        if certificate is None:
            print(f'Could not resolve domain {url.host.decode()}')
            return
        with socket.create_connection((certificate.ip, url.port)) as tcp_socket:
            with SSL_PROXY_CONTEXT.wrap_socket(tcp_socket, server_hostname=certificate.domain) as tls_socket:
                server_ssl_cert = tls_socket.getpeercert(binary_form=True)
                # TODO: it's possible that resolution fails here because the public key is incorrect
                # In this case, should issue a certificate from an untrusted root
                certificate.verify(server_ssl_cert)

                self.request.sendall(b'HTTP/1.1 200 Connection established\r\n\r\n')
                # dynamically generate a certificate for the given website, using its domain but our own custom credentials.
                # Then sign the certificate using our private key. (This code derived from
                # https://stackoverflow.com/questions/27164354/create-a-self-signed-x509-certificate-in-python)
                client_ssl_cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, server_ssl_cert)
                client_ssl_cert.gmtime_adj_notBefore(0)
                client_ssl_cert.gmtime_adj_notAfter(60) # set generated certificate to expire after one minute
                client_ssl_cert.set_pubkey(ssl_cert.get_pubkey())
                client_ssl_cert.set_issuer(ssl_cert.get_issuer())
                client_ssl_cert.set_serial_number(int(uuid.uuid4()))
                client_ssl_cert.sign(ssl_sk, 'sha256WithRSAEncryption')
                filename = f'TMPcrt_{os.getpid()}_{self.request.fileno()}.crt'
                with open(filename, 'wb') as tmp_crt_file: #TODO make sure this gets deleted
                    tmp_crt_file.write(OpenSSL.crypto.dump_certificate(OpenSSL.crypto.FILETYPE_PEM, client_ssl_cert))
                custom_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
                custom_context.load_cert_chain(filename, 'domain.key')
                with custom_context.wrap_socket(self.request, server_side = True) as client_tls_socket:
                    #TODO note that I'm not sure wrapping will work with my rewind feature. Shouldn't be an issue if
                    # client waits to start sending me stuff until I send Connection established
                    while True:
                        ready = select.select([client_tls_socket, tls_socket], [], [])
                        if client_tls_socket in ready[0]:
                            b = client_tls_socket.recv(4096)
                            if len(b) == 0:
                                client_tls_socket.close()
                                tls_socket.close()
                                break
                            else:
                                tls_socket.sendall(b)
                        if tls_socket in ready[0]:
                            b = tls_socket.recv(4096)
                            if len(b) == 0:
                                client_tls_socket.close()
                                tls_socket.close()
                                break
                            else:
                                client_tls_socket.sendall(b)

    def handle_http(self):
        # rules for header forwarding:
        # 1. Content-Length MUST be present if the request has a body
        # 2. Host header MUST indicate the server we're connecting to
        # 3. Hop-by-hop headers, including those specified in the Connection header, must be removed
        # 4. Other than that, all headers should be forwarded intact
        forwarded_headers = dict(self.http_request.headers)
        host = httpparse.HttpUrl.parse(self.http_request.url).host
        forwarded_headers[b'Host'] = host
        if self.http_request.body is not None:
            forwarded_headers[b'Content-Length'] = str(len(self.http_request.body)).encode()

        if b'Connection' in self.http_request.headers:
            for hopbyhop_header in self.http_request.headers[b'Connection'].split(b','):
                forwarded_headers.pop(httpparse._capitalize(hopbyhop_header.strip()), None)

        for hopbyhop_header in [b'Keep-Alive', b'Transfer-Encoding', b'TE', b'Connection', b'Trailer', b'Upgrade', b'Proxy-Authorization', b'Proxy-Authenticate']:
            forwarded_headers.pop(hopbyhop_header, None)

        try:
            response = siip_requests.request(self.http_request.method, self.http_request.url, forwarded_headers, self.http_request.body, self.http_request.version)

            if LOG:
                print('%-32s%s'%(f'{self.http_requestquest.method.decode()} {self.http_request.url.decode()}', f'{response.statuscode} {response.status.decode()} [{len(response.body)} bytes]'))
        except siip_certificate.SiipCertError:
            response = httpparse.HttpResponse(500, b'Internal Server Error', b'HTTP/1.1')
            host = forwarded_headers[b'Host'].decode()
            response.body = f"""<!DOCTYPE html>
                <html>
                    <head><title>Invalid certificate: {host}</title></head>
                    <body>
                        <h1>Certificate error!!</h1>
                        <p>The host {host} presented an invalid SIIP certificate. This indicates that either the page's certificate is out of date, or
                        someone is trying to intercept your network traffic. If the problem persists, please contact the owners of the website.</p>
                    </body>
                </html>""".encode()

        if b'Transfer-Encoding' in response.headers:
            del response.headers[b'Transfer-Encoding']
        response.headers[b'Content-Length'] = str(len(response.body) if response.body is not None else 0).encode()
        self.request.sendall(response.version + b' ' + str(response.statuscode).encode() + b' ' + response.status + b'\r\n')
        for hdr in response.headers:
            self.request.sendall(hdr + b': ' + response.headers[hdr] + b'\r\n')
        self.request.sendall(b'\r\n')

        if response.body is not None:
            self.request.sendall(response.body)

    def handle(self):
        self.request = httpparse.BufferedSocket(self.request)

        self.http_request = httpparse.HttpRequest.parse_header(self.request)

        if self.http_request is None:
            # TODO look into this: I noticed it happening with badssl.com. It was accompanied by obscenely long page load times
            print("WARNING: client opened socket but didn't never sent anything")
            return
        elif self.http_request.method == b'CONNECT':
            self.handle_tunnel()
        else:
            # read the rest of the request
            self.http_request.parse_body(self.request)
            self.handle_http()

class ProxyServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    def __init__(self, address):
        socketserver.TCPServer.__init__(self, address, ProxyHandler)

if __name__ == '__main__':
    HOST, PORT = '0.0.0.0', 8080
    with ProxyServer((HOST, PORT)) as server:
        if LOG:
            print('Request                         Response')
            print('----------------------------------------------------------------')
        server.serve_forever()
