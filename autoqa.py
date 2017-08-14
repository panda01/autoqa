import sys
import time
import base64
from PyQt4.QtCore import *
from PyQt4.QtGui import *
from PyQt4.QtWebKit import *
from PyQt4 import QtNetwork


from selenium import webdriver

class Screenshot(QWebPage):
    def __init__(self):
        self.app = QApplication(sys.argv)

    def capture(self, url, output_file):
        username = "demo"
        password = "password"

        base64String = base64.encodestring('%s:%s' % (username, password))[:-1]
        authHeader = "Basic %s" % base64String

        headerKey = QByteArray("Authorization")
        headerValue = QByteArray(authHeader)

        req = QtNetwork.QNetworkRequest()
        req.setRawHeader(headerKey, headerValue)
        req.setUrl(QUrl(url))

        QWebPage.__init__(self)
        self.loadFinished.connect(self._loadFinished)

        self.mainFrame().load(req)
        self.app.exec_()

        # set to webage size
        frame = self.mainFrame()
        self.setViewportSize(frame.contentsSize())

        # render image
        image = QImage(self.viewportSize(), QImage.Format_ARGB32)
        print 'Init Painter'
        painter = QPainter(image)
        print 'Frame render'
        frame.render(painter)
        painter.end()
        print 'saving', output_file
        image.save(output_file)
        print 'saved'


    def _loadFinished(self, result):
        self.frame = self.mainFrame()
        self.app.quit()


s = Screenshot()
s.capture('http://agileone.staging.wpengine.com', 'agileone_staging.png')
s.capture('http://agileone.wpengine.com', 'agileone_prod.png')
