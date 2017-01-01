#!/usr/bin/env/ python
# -*- coding: UTF-8 -*-

# enable debugging
import sys
from BaseHTTPServer import HTTPServer as ServerClass
from SimpleHTTPServer import SimpleHTTPRequestHandler as HandlerClass

Protocol = 'HTTP/1.0'

if sys.argv[1:]:
    port = int(sys.argv[1])
else:
    port = 8000

server_address = ('127.0.0.1', port)

HandlerClass.protocol_version = Protocol
httpd = ServerClass(server_address, HandlerClass)

socket_info = httpd.socket.getsockname()
print 'Serving HTTP on ', socket_info[0], 'port', socket_info[1], '...'

def do_GET(self):
    print 'Doing a GET'

def do_POST(self):
    print 'Doing a post'

httpd.serve_forever()
