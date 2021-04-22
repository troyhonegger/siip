STATE_START = 0
STATE_RCVHDRS = 1
STATE_RCVBODY = 2
STATE_DONE = 3

# Capitalizes hyphenated words in a bytes array; i.e. converts b'cOnTeNt-LeNgTh' to b'Content-Length'
def _capitalize(header_name):
    return b'-'.join([segment.capitalize() for segment in header_name.split(b'-')])

class HttpUrl:
    # Parses a URL that looks like: [protocol://]host[:port][/uri]
    # returns (protocol, domain, port, url)
    @classmethod
    def parse(cls, string):
        fields = string.split(b'://', maxsplit = 1)
        if len(fields) > 1:
            protocol, string = fields
            protocol = protocol.lower()
        else:
            protocol = b'https'

        fields = string.split(b'/', maxsplit = 1)
        if len(fields) > 1:
            host, url = fields
            url = b'/' + url
        else:
            host = fields[0]
            url = b'/'

        if b':' in host:
            host, port = host.split(b':')
            port = int(port)
        else:
            port = 443 if protocol == b'https' else 80

        return HttpUrl(protocol, host.lower(), port, url)

    def __init__(self, protocol, host, port, uri):
        self.protocol = protocol
        self.host = host
        self.port = port
        self.uri = uri

    def __str__(self):
        return f'{self.protocol.decode()}://{self.host.decode()}:{self.port}{self.uri}'

class HttpRequest:
    # Reads from sock, and parses (and returns) an HttpRequest object from the stream of bytes
    # NOTE: The HTTP spec is full of corner cases and rarely-used extra features. Not all of these
    # are implemented. Features that are known to be missing are marked with 'HTTP-COMPLIANCE' comments
    @classmethod
    def parse(cls, sock):
        state = STATE_START
        request = HttpRequest()
        buf = b''
        while state != STATE_DONE:
            rcvd = sock.recv(4096)
            if len(rcvd) == 0:
                break # client closed connection: we won't get anything more

            buf += rcvd

            if state == STATE_START:
                newline = buf.find(b'\r\n')
                if newline >= 0:
                    request.method, request.url, request.version = buf[:newline].split(b' ', maxsplit = 2)
                    buf = buf[newline + 2:]
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
                    if key in request.headers:
                        request.headers[key] += b',' + value
                    else:
                        request.headers[key] = value

                    newline = buf.find(b'\r\n')

            if state == STATE_RCVBODY:
                if b'Transfer-Encoding' in request.headers and request.headers[b'Transfer-Encoding'].lower() == b'chunked':
                    # HTTP-COMPLIANCE: Other less-common values for Transfer-Encoding exist (other than "chunked")
                    newline = buf.find(b'\r\n')

                    while newline >= 0:
                        line = buf[:newline]
                        chunk_size = int(line, base = 16)

                        rcvd_chunk_size = len(buf) - len(line) - 2 # -2 is for CRLF after chunk size
                        if chunk_size + 2 > rcvd_chunk_size: # +2 is for CRLF after chunk
                            break # still waiting for entire chunk to be sent

                        buf = buf[newline + 2:]
                        request.body += buf[:chunk_size]
                        buf = buf[chunk_size + 2:]

                        if chunk_size == 0:
                            # chunked messages end with an empty (length-0) chunk
                            state = STATE_DONE

                        newline = buf.find(b'\r\n')

                elif b'Content-Length' in request.headers:
                    length = int(request.headers[b'Content-Length'])
                    request.body += buf
                    buf = b''
                    if len(request.body) >= length:
                        state = STATE_DONE
                else:
                    # the client hasn't specified that a request body follows, so we'll assume it doesn't
                    request.body = None
                    state = STATE_DONE
        if state == STATE_DONE:
            return request
        else:
            raise ConnectionClosedUnexpectedly()

    def __init__(self, method = None, url = None, version = None, headers = dict(), body = b''):
        self.method = method
        self.url = url
        self.version = version
        self.headers = dict(headers)
        self.body = body

    def __str__(self):
        s = f'{self.method.decode()} {self.url.decode()} {self.version.decode()}\r\n'

        for hdr in self.headers:
            s += f'{hdr.decode()}: {self.headers[hdr].decode()}\r\n'

        s += '\r\n'

        if self.body is not None:
            s += self.body.decode(errors='replace')

        return s

class HttpResponse:
    # Reads from sock, and parses (and returns) an HttpResponse object from the stream of bytes
    # NOTE: The HTTP spec is full of corner cases and rarely-used extra features. Not all of these
    # are implemented. Features that are known to be missing are marked with 'HTTP-COMPLIANCE' comments
    @classmethod
    def parse(cls, sock):
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
            raise ConnectionClosedUnexpectedly()


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

class ConnectionClosedUnexpectedly(Exception):
    pass
