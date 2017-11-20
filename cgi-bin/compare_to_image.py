#!/usr/bin/python

import cgi
import cgitb
import autoqa
import hashlib
import shutil
import os
import cv2
import MySQLdb
import datetime

cgitb.enable(display=1)

# HTML page
print "Content-type: text/html\n\n"

#init some vars
form = cgi.FieldStorage()
# db = MySQLdb.connect(host="127.0.0.1", port=3306, user="root", passwd="root", db="autoqa_db_v1")
# cursor = db.cursor()
now = datetime.datetime.now()


compare_image = form['comparison_image']
uploaded_file_path = None
if form.has_key('comparison_image') and compare_image.file:
    uploaded_file = compare_image.file
    filename, ext = os.path.splitext(compare_image.filename)
    uploaded_file_path = os.path.join('../uploads', hashlib.sha1(filename).hexdigest() + ext)
    try:
        write_stream = file(uploaded_file_path, 'wb')
        while 1:
            chunk = uploaded_file.read(10000)
            if not chunk: break;
            write_stream.write(chunk)
        write_stream.close()
        print 'Uploaded file to %s <br />' % uploaded_file_path
    except:
        uploaded_file_path = None
        print 'Couldn\'t write to server <br />'

else:
        print 'No file to Upload <br />'


if form.has_key('website_address'):
    web_url = form["website_address"].value
    shorter_url = web_url.replace('http://', '')
    shorter_url = web_url.replace('http://', '')
    safe_url = shorter_url.replace('/', '')
    screenshot_img = autoqa.getPageScreenshot(web_url)
    screenshot_filepath = os.path.join('../uploads/', safe_url + '.png')

    screenshot_img.save(screenshot_filepath)

    print 'Screenshot taken, and placed at %s <br />' % screenshot_filepath


if uploaded_file_path and screenshot_filepath:
    file_prefix = now.strftime('%y-%-m-%-d_%-H:%-M:%-S_')
    (diff_img, threshold_img, contours_img) = autoqa.compareImages(uploaded_file_path, screenshot_filepath, file_prefix)
    comparison_image_prefix = os.path.abspath(os.path.join('../comparisons/'))

    cv2.imwrite(comparison_image_prefix + '/' + file_prefix + 'diff_img.png', diff_img)
    cv2.imwrite(comparison_image_prefix + '/' + file_prefix + 'threshold_img.png', threshold_img)
    cv2.imwrite(comparison_image_prefix + '/' + file_prefix + 'contours_img.png', contours_img)

print 'End.'

