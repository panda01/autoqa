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
db = MySQLdb.connect(host="127.0.0.1", port=3306, user="root", passwd="root", db="autoqa_db_v1")
cursor = db.cursor()
now = datetime.datetime.now()

if form.has_key('comparison_image'):
    file_param = form['comparison_image']
    if file_param.file:
        filename, ext = os.path.splitext(file_param.filename)
        uploaded_file_path = os.path.join('../uploads', hashlib.sha1(filename).hexdigest() + ext) # Make sure to not just use whatever name they give you.
        try:
            write_stream = file(uploaded_file_path, 'wb')
            print 'Opened stream<br />'
            while 1:
                chunk = file_param.file.read(10000)
                if not chunk: break;
                write_stream.write(chunk)
            write_stream.close()
            print 'Uploaded file to %s <br />' % uploaded_file_path
        except:
            print 'Couldn\'t write to server <br />'
        cursor.execute("INSERT INTO `uploads` (`filepath`) VALUES ('%s')" % (uploaded_file_path))
        uploads_row_id = cursor.lastrowid

    else:
        print 'No file to Upload <br />'

else:
    print 'No Param comparison_image <br />'


if form.has_key('website_address'):
    form["website_address"].value
    screenshot_path = autoqa.getPageScreenshot(form["website_address"].value)
    cursor.execute("INSERT INTO `screenshots` (`url`, `path`) VALUES ('%s', '%s')" % (form['website_address'].value, screenshot_path))
    screenshots_row_id = cursor.lastrowid
    print 'Screenshot taken, and placed at %s <br />' % screenshot_path


if uploaded_file_path and screenshot_path:
    print 'Houston we have lift off'
    file_prefix = now.strftime('%y-%-m-%-d_%-H.%-M.%-S')
    (diff_img, threshold_img, contours_img) = autoqa.compareImages(uploaded_file_path, screenshot_path, file_prefix)
    # Add db records
    cursor.execute("INSERT INTO `comparisons` (`screenshot_id`, `upload_id`, `diff_path`, `thresh_path`, `contours_path`) VALUES ('%s', '%s', '%s', '%s', '%s')" % (screenshots_row_id, uploads_row_id, diff_img, threshold_img, contours_img))
    comparisons_row_id = cursor.lastrowid



db.commit()
db.close()
