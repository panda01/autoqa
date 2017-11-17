#!/usr/bin/python

import cgi
import cgitb
import sys
import imutils

cgitb.enable(display=1)

print "Content-type: text/html\n\n"

print sys.version
print sys.prefix
print cgi.__file__
