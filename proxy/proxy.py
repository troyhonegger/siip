#!/usr/bin/python3

import argparse
import html
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

#TODO siip_requests needs to use fallback resolution (if configured)

SSL_PROXY_CONTEXT = ssl._create_unverified_context()
SSL_PROXY_LEGACY_CONTEXT = ssl.create_default_context()


ssl_sk = None
ssl_cert = None
with open('domain.key', 'rb') as sk_file:
    ssl_sk = OpenSSL.crypto.load_privatekey(OpenSSL.crypto.FILETYPE_PEM, sk_file.read())
with open('domain.crt', 'rb') as cert_file:
    ssl_cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert_file.read())

class ProxyHandler(socketserver.BaseRequestHandler):
    def handle_tunnel(self):
        url = httpparse.HttpUrl.parse(self.http_request.url)

        # resolve the domain name. Try using SIIP first and, if that fails (and legacy_fallback is enabled),
        # fallback to standard DNS/HTTPS
        verify_method = 'siip'
        domain = url.host.decode()
        certificate = siip_resolve.resolve(domain)
        if certificate is None and self.server.legacy_fallback:
            if self.server.log:
                print(f'Could not resolve domain {domain}. Falling back to standard DNS/HTTPS')
            verify_method = 'legacy'
            ip = siip_resolve.fallback_resolve(domain)
            if ip is None:
                self.send_404_domain_notfound(domain)
                return
            elif self.server.auto_scrape:
                pass #TODO add new domain to blockchain
        elif certificate is None and not self.server.legacy_fallback:
            if self.server.log:
                print(f'Could not resolve domain {domain}. Returning 404 as legacy fallback is disabled')
            self.send_404_domain_notfound(domain)
            return
        else:
            ip = certificate.ip

        with socket.create_connection((ip, url.port)) as tcp_socket:
            server_ssl_context = SSL_PROXY_CONTEXT
            if verify_method != 'siip':
                server_ssl_context = SSL_PROXY_LEGACY_CONTEXT
            with server_ssl_context.wrap_socket(tcp_socket, server_hostname=domain, do_handshake_on_connect=False) as tls_socket:
                try:
                    tls_socket.do_handshake()
                except ssl.SSLError as ex:
                    assert verify_method != 'siip' # do_handshake should only raise exception if using standard DNS/HTTPS
                    if self.server.log:
                        print(f'Domain {domain} has an untrusted TLS certificate. Refusing connection, and returning 500')
                    self.send_500_badtlscert(domain, ex)
                    return

                server_ssl_cert = tls_socket.getpeercert(binary_form=True)
                if verify_method == 'siip':
                    try:
                        certificate.verify(server_ssl_cert)
                    except siip_certificate.SiipCertError as ex:
                        if self.server.log:
                            print(f'Domain {domain} has an untrusted SIIP certificate. Refusing connection, and returning 500')
                        self.send_500_badsiipcert(domain, ex)
                        return

                self.request.sendall(b'HTTP/1.1 200 Connection established\r\n\r\n')
                # dynamically generate a certificate for the given website, using its domain but our own custom credentials.
                # Then sign the certificate using our private key. (This code derived from
                # https://stackoverflow.com/questions/27164354/create-a-self-signed-x509-certificate-in-python)

                # TODO I'd like to cache these certificates, but I'm not sure what to cache. I could cache the custom_context's,
                # or just not delete the files, or move the PEM bytes to Redis but still create a separate file for each request.
                client_ssl_cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, server_ssl_cert)
                client_ssl_cert.gmtime_adj_notBefore(0)
                client_ssl_cert.gmtime_adj_notAfter(60) # set generated certificate to expire after one minute
                client_ssl_cert.set_pubkey(ssl_cert.get_pubkey())
                client_ssl_cert.set_issuer(ssl_cert.get_issuer())
                client_ssl_cert.set_serial_number(int(uuid.uuid4()))
                client_ssl_cert.sign(ssl_sk, 'sha256WithRSAEncryption')
                filename = f'TMPcrt_{os.getpid()}_{self.request.fileno()}.crt'
                with open(filename, 'wb') as tmp_crt_file:
                    tmp_crt_file.write(OpenSSL.crypto.dump_certificate(OpenSSL.crypto.FILETYPE_PEM, client_ssl_cert))
                try:
                    custom_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
                    custom_context.load_cert_chain(filename, 'domain.key')
                    with custom_context.wrap_socket(self.request, server_side = True) as client_tls_socket:
                        #TODO note that I'm not sure wrapping will work with my rewind feature. Shouldn't be an issue if
                        # client waits to start sending me stuff until I send Connection established
                        self.passive_proxy(client_tls_socket, tls_socket, domain)
                finally:
                    os.remove(filename)

    def passive_proxy(self, client, server, domain):
        # TODO it might be nice to have an option to turn on more verbose logging that's not just all at the end
        # good for if some connections are hanging

        # SSL doesn't play particularly nice with select(), but the StackOverflow post
        # https://stackoverflow.com/questions/3187565/select-and-ssl-in-python
        # had some helpful hints to get things working. For optimal robustness the author recommended nonblocking IO
        client.setblocking(0)
        server.setblocking(0)

        client_line_rcvd = False
        server_line_rcvd = False
        line_client = b''
        line_server = b''

        client_to_server = b''
        server_to_client = b''
        client_closed = False
        server_closed = False

        while len(client_to_server) != 0 or len(server_to_client) != 0 or (not client_closed and not server_closed):
            read = []
            if not client_closed:
                read.append(client)
            if not server_closed:
                read.append(server)

            write = []
            if len(client_to_server) != 0:
                write.append(server)
            if len(server_to_client) != 0:
                write.append(client)

            read, write, error = select.select(read, write, [client, server])
            if client in read:
                try:
                    b = client.recv(4096)
                    # SSL sockets have a "pending" buffer that select() doesn't know about. That buffer has to be
                    # emptied before select() is called again; otherwise select() might block indefinitely
                    pending = client.pending()
                    while pending != 0:
                        b += client.recv(pending)
                        pending = client.pending()
                except ssl.SSLError as e:
                    if e.errno != ssl.SSL_ERROR_WANT_READ:
                        raise
                    b = None

                if b is None:
                    pass # indicates SSL_ERROR_WANT_READ
                elif len(b) == 0:
                    client_closed = True
                else:
                    if self.server.log and not client_line_rcvd:
                        line_client += b
                        idx = line_client.find(b'\r\n')
                        if idx > -1:
                            client_line_rcvd = True
                            line_client = line_client[:idx]
                    client_to_server += b

            if server in read:
                try:
                    b = server.recv(4096)
                    # SSL sockets have a "pending" buffer that select() doesn't know about. That buffer has to be
                    # emptied before select() is called again; otherwise select() might block indefinitely
                    pending = server.pending()
                    while pending != 0:
                        b += server.recv(pending)
                        pending = server.pending()
                except ssl.SSLError as e:
                    if e.errno != ssl.SSL_ERROR_WANT_READ:
                        raise
                    b = None

                if b is None:
                    pass # indicates SSL_ERROR_WANT_READ
                elif len(b) == 0:
                    server_closed = True
                else:
                    if self.server.log and not server_line_rcvd:
                        line_server += b
                        idx = line_server.find(b'\r\n')
                        if idx > -1:
                            server_line_rcvd = True
                            line_server = line_server[:idx]
                    server_to_client += b

            if server in write:
                n = server.send(client_to_server)
                client_to_server = client_to_server[n:]
            if client in write:
                n = client.send(server_to_client)
                server_to_client = server_to_client[n:]

        if self.server.log:
            line_client = line_client.decode()
            if len(line_client) > 32:
                line_client = line_client[:31] + '…'
            print('%-32s: %-32s => %s'%(domain, line_client, line_server.decode()))

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

            if self.server.log:
                req_summary = f'{self.http_requestquest.method.decode()} {self.http_request.url.decode()} {self.http_request.version.decode()}'
                if len(req_summary) > 32:
                    req_summary = req_summary[:31] + '…'
                print('%-32s: %-32s => %s'%(host, req_summary, f'{response.statuscode} {response.status.decode()} {response.version.decode()} [{len(response.body)} bytes]'))
        except siip_certificate.SiipCertError as ex:
            if self.server.log:
                print(f'Domain {host} has an untrusted SIIP certificate. Refusing connection, and returning 500')
            response = httpparse.HttpResponse(500, b'Internal Server Error', b'HTTP/1.1')
            host = html.escape(forwarded_headers[b'Host'].decode())
            response.body = f"""<!DOCTYPE html><html>
                <head><title>Bad TLS Certificate: {host}</title></head>
                <body>
                    <h1>Error 500: Untrusted SIIP certificate</h1>
                    <p>
                        Refusing to connect to domain {host} as it contains an untrusted SIIP certificate.
                        Either the website's certificate is out of date, or someone is attempting a man-in-the-middle attack.
                    </p>
                    <p>
                        If the problem persists, please contact the website owner.
                    </p>
                    <p>
                        {ex}
                    </p>
                </body></html>""".encode()

        if b'Transfer-Encoding' in response.headers:
            del response.headers[b'Transfer-Encoding']

        response.headers[b'Content-Length'] = str(len(response.body) if response.body is not None else 0).encode()

        self.send_response(response)

    def handle(self):
        self.request = httpparse.BufferedSocket(self.request)

        self.http_request = httpparse.HttpRequest.parse_header(self.request)

        if self.http_request is None:
            print("WARNING: client opened socket but never sent anything")
            return
        elif self.http_request.method == b'CONNECT':
            self.handle_tunnel()
        else:
            # read the rest of the request
            self.http_request.parse_body(self.request)
            self.handle_http()

    def send_response(self, response, sock = None):
        if sock is None:
            sock = self.request
        sock.sendall(response.version + b' ' + str(response.statuscode).encode() + b' ' + response.status + b'\r\n')
        for hdr in response.headers:
            sock.sendall(hdr + b': ' + response.headers[hdr] + b'\r\n')
        sock.sendall(b'\r\n')

        if response.body is not None:
            sock.sendall(response.body)

    def send_404_domain_notfound(self, domain):
        domain = html.escape(domain)
        response404 = httpparse.HttpResponse(404, b'Not Found', b'HTTP/1.1', {b'Content-Encoding': b'text/plain'})
        if self.server.legacy_fallback:
            response404.body = f"""<!DOCTYPE html><html>
                <head><title>404 Not found: {domain}</title></head>
                <body>
                    <h1>Error 404: domain not found</h1>
                    <p>Could not resolve domain {domain} via either SIIP or legacy DNS/HTTPS. Please make sure the domain is spelled correctly.</p>
                </body></html>""".encode()
        else:
            response404.body = f"""<!DOCTYPE html><html>
                <head><title>404 Not found: {domain}</title></head>
                <body>
                    <h1>Error 404: domain not found</h1>
                    <p>Could not resolve domain {domain} via SIIP, and legacy fallback is disabled. Please make sure the domain is spelled correctly, and check whether it has been added to the blockchain.</p>
                </body></html>""".encode()
        response404.headers[b'Content-Length'] = str(len(response404.body)).encode()
        self.send_response(response404)

    def send_500_badtlscert(self, domain, ex):
        domain = html.escape(domain)
        response500 = httpparse.HttpResponse(500, b'Internal Server Error', b'HTTP/1.1', {b'Content-Encoding': b'text/html'})
        response500.body = f"""<!DOCTYPE html><html>
            <head><title>Bad TLS Certificate: {domain}</title></head>
            <body>
                <h1>Error 500: Untrusted TLS certificate</h1>
                <p>
                    Refusing to connect to domain {domain} as it contains an untrusted TLS certificate.
                    This could mean someone is attempting a man-in-the-middle attack.
                </p>
                <p>
                    If you know you're talking to {domain}, and you're sure it's safe to continue connecting,
                    you can add the certificate to the blockchain. But only do this if you know what you're doing.
                </p>
                <p>
                    {ex}
                </p>
            </body></html>""".encode()
        self.send_response(response500)

    def send_500_badsiipcert(self, domain, ex):
        domain = html.escape(domain)
        response500 = httpparse.HttpResponse(500, b'Internal Server Error', b'HTTP/1.1', {b'Content-Encoding': b'text/html'})
        response500.body = f"""<!DOCTYPE html><html>
            <head><title>Bad TLS Certificate: {domain}</title></head>
            <body>
                <h1>Error 500: Untrusted SIIP certificate</h1>
                <p>
                    Refusing to connect to domain {domain} as it contains an untrusted SIIP certificate.
                    Either the website's certificate is out of date, or someone is attempting a man-in-the-middle attack.
                </p>
                <p>
                    If the problem persists, please contact the website owner.
                </p>
                <p>
                    {ex}
                </p>
            </body></html>""".encode()
        self.send_response(response500)

class ProxyServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    def __init__(self, address, legacy_fallback, auto_scrape, log):
        socketserver.TCPServer.__init__(self, address, ProxyHandler)
        self.legacy_fallback = legacy_fallback
        self.auto_scrape = auto_scrape
        self.log = log

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--legacy-fallback', action='store_true', \
        help='Enable legacy fallback to standard DNS/TLS if a SIIP certificate does not exist')
    parser.add_argument('--auto-scrape', action='store_true', \
        help='Automatically add certificates to SIIP after they are queried, if the domain can be resolved and the certificate is valid.')
    parser.add_argument('--log', action='store_true', \
        help='Log requests to standard out')
    args = parser.parse_args()

    HOST, PORT = '0.0.0.0', 8080
    with ProxyServer((HOST, PORT), args.legacy_fallback, args.auto_scrape, args.log) as server:
        if args.log:
            print('Domain                            Request                             Response')
            print('------------------------------------------------------------------------------------------------------')
        server.serve_forever()
