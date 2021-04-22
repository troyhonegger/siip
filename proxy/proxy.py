#!/usr/bin/python3

#TODO: need to support CONNECT verb for HTTPS tunneling. This will be somewhat complicated

import os
import socketserver
import ssl

import httpparse
import siip_certificate
import siip_requests

STATE_START = 0
STATE_RCVHDRS = 1
STATE_RCVBODY = 2
STATE_DONE = 3

LOG = True

class ProxyHandler(socketserver.BaseRequestHandler):
    def handle(self):
        request = httpparse.HttpRequest.parse(self.request)
        forwarded_headers = dict(request.headers)
        host = httpparse.HttpUrl.parse(request.url).host
        forwarded_headers[b'Host'] = host
        if b'Transfer-Encoding' in forwarded_headers:
            del forwarded_headers[b'Transfer-Encoding']
            if request.body is not None:
                forwarded_headers[b'Content-Length'] = str(len(request.body)).encode()

        try:
            response = siip_requests.request(request.method, request.url, forwarded_headers, request.body, request.version)

            if LOG:
                print('%-32s%s'%(f'{request.method.decode()} {request.url.decode()}', f'{response.statuscode} {response.status.decode()} [{len(response.body)} bytes]'))
        except siip_certificate.SiipCertError:
            pass #TODO

        if b'Transfer-Encoding' in response.headers:
            del response.headers[b'Transfer-Encoding']
        response.headers[b'Content-Length'] = str(len(response.body) if response.body is not None else 0).encode()
        self.request.sendall(response.version + b' ' + str(response.statuscode).encode() + b' ' + response.status + b'\r\n')
        for hdr in response.headers:
            self.request.sendall(hdr + b': ' + response.headers[hdr] + b'\r\n')
        self.request.sendall(b'\r\n')

        if response.body is not None:
            self.request.sendall(response.body)

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
