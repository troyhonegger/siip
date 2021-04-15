#!/usr/bin/python

import socket
import ssl

import siip_resolve

# TODO wish list:
    # standard, unencrypted HTTP support - right now request() ignores the protocol and assumes HTTPS
    # websocket support?

SSL_CONTEXT = ssl._create_unverified_context()

class HttpResponse:
    def __init__(self, statuscode = None, status = None, version = None, headers = dict(), body = b''):
        self.statuscode = statuscode
        self.status = status
        self.version = version
        self.headers = dict(headers)
        self.body = body

    def __str__(self):
        s = f'{self.version.decode()} {self.statuscode} {self.status.decode()}\r\n'

        for hdr in self.headers:
            s += f'{hdr.decode()}: {self.headers[hdr].decode()}\r\n'
        s += '\r\n'

        if self.body is not None:
            s += self.body.decode(errors='replace')

        return s

def get(url, headers, content = None, version = 'HTTP/1.1'):
    return request('GET', url, headers, content, version)

class ServerClosedConnection(Exception):
    pass

# Capitalizes hyphenated words in a bytes array; i.e. converts b'cOnTeNt-LeNgTh' to b'Content-Length'
def _capitalize(header_name):
    return b'-'.join([segment.capitalize() for segment in header_name.split(b'-')])

def request(method, url, headers, content = None, version = 'HTTP/1.1', ssl_context = SSL_CONTEXT):
    fields = url.split('://', maxsplit = 1)
    if len(fields) > 1:
        protocol, url = fields
    else:
        protocol = 'https'

    fields = url.split('/', maxsplit = 1)
    if len(fields) > 1:
        hostname, url = fields
        url = '/' + url
    else:
        hostname = fields[0]
        url = '/'

    if ':' in hostname:
        domain, port = hostname.split(':')
        port = int(port)
    else:
        domain = hostname
        port = 443

    cert = siip_resolve.resolve(domain)
    with socket.create_connection((cert.ip, port)) as tcp_sock:
        with ssl_context.wrap_socket(tcp_sock, server_hostname=domain) as tls_sock:
            cert.verify(tls_sock.getpeercert(binary_form=True))
            tls_sock.write(f'{method} {url} {version}\r\n'.encode())
            for hdr in headers:
                tls_sock.write(f'{hdr}: {headers[hdr]}\r\n'.encode())
            tls_sock.write(b'\r\n')

            if content is not None:
                tls_sock.write(str(content).encode())

            return _read_http_response(tls_sock)

# Reads from sock, and parses (and returns) an HttpResponse object from the stream of bytes
# NOTE: The HTTP spec is full of corner cases and rarely-used extra features. Not all of these
# are implemented. Features that are known to be missing are marked with 'HTTP-COMPLIANCE' comments
def _read_http_response(sock):
    STATE_START = 0
    STATE_RCVHDRS = 1
    STATE_RCVBODY = 2
    STATE_DONE = 3

    state = STATE_START
    response = HttpResponse()
    buf = b''
    while state != STATE_DONE:
        rcvd = sock.recv(4096)
        if len(rcvd) == 0:
            break # server closed connection: we won't get anything more

        buf += rcvd

        if state == STATE_START:
            newline = buf.find(b'\r\n')
            if newline >= 0:
                version, statuscode, status = buf[:newline].split(b' ', maxsplit = 2)
                buf = buf[newline + 2:]

                response.version = version
                response.statuscode = int(statuscode)
                response.status = status
                state = STATE_RCVHDRS

        if state == STATE_RCVHDRS:
            newline = buf.find(b'\r\n')
            while newline >= 0:
                line = buf[:newline]
                buf = buf[newline + 2:]

                if len(line) == 0:
                    state = STATE_RCVBODY
                    break

                key, value = line.split(b': ', maxsplit = 1)
                key = _capitalize(key) # HTTP headers must be case-insensitive, so convert b'cOnTeNt-LeNgTh' to b'Content-Length'
                if key in response.headers:
                    response.headers[key] += b',' + value
                else:
                    response.headers[key] = value

                newline = buf.find(b'\r\n')

        if state == STATE_RCVBODY:
            if response.statuscode < 200 or response.statuscode == 204 or response.statuscode == 304:
                # these messages cannot have a response body, no matter what Content-Length or Transfer-Encoding may say
                # HTTP-COMPLIANCE: this also should apply if the request was a HEAD request
                response.body = None
                state = STATE_DONE
            elif b'Transfer-Encoding' in response.headers and response.headers[b'Transfer-Encoding'].lower() == b'chunked':
                # HTTP-COMPLIANCE: Other less-common values for Transfer-Encoding exist (other than "chunked")
                newline = buf.find(b'\r\n')

                while newline >= 0:
                    line = buf[:newline]
                    chunk_size = int(line, base = 16)

                    rcvd_chunk_size = len(buf) - len(line) - 2 # -2 is for CRLF after chunk size
                    if chunk_size + 2 > rcvd_chunk_size: # +2 is for CRLF after chunk
                        break # still waiting for entire chunk to be sent

                    buf = buf[newline + 2:]
                    response.body += buf[:chunk_size]
                    buf = buf[chunk_size + 2:]

                    if chunk_size == 0:
                        # chunked messages end with an empty (length-0) chunk
                        state = STATE_DONE

                    newline = buf.find(b'\r\n')

            elif b'Content-Length' in response.headers:
                length = int(response.headers[b'Content-Length'])
                response.body += buf
                buf = b''
                if len(response.body) >= length:
                    state = STATE_DONE
            # HTTP-COMPLIANCE: this doesn't support "multipart/byteranges" - to add support, insert an extra case here
            else:
                # the server isn't giving us any hints as to what's in store. We'll just have to keep recv()'ing
                # and let it close the connection when it's ready
                response.body += buf
                buf = b''

    if state in [STATE_DONE, STATE_RCVBODY]:
        return response
    else:
        raise ServerClosedConnection()


if __name__ == '__main__':
    print(get('https://www.google.com', {'Host': 'www.google.com'}))
