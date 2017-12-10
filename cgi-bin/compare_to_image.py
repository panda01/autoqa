#!/usr/bin/python

import cgi
import cgitb
import autoqa
import hashlib
import shutil
import os
import cv2
import datetime
from json import JSONEncoder

cgitb.enable(display=1)

# HTML page
print "Content-type: application/json\n\n"


json_return_obj = {};

#init some vars
form = cgi.FieldStorage()
# db = MySQLdb.connect(host="127.0.0.1", port=3306, user="root", passwd="root", db="autoqa_db_v1")
# cursor = db.cursor()

web_url = form["website_address"].value
now = datetime.datetime.now()
file_date_prefix = now.strftime('%y-%-m-%-d_%-H:%-M:%-S_') + hashlib.sha1(web_url).hexdigest() + '_'


uploaded_file_path = None
if form.has_key('comparison_image'):
    if form['comparison_image'].file and form['comparison_image'].filename:
        compare_image = form['comparison_image']
        uploaded_file = compare_image.file
        filename, ext = os.path.splitext(compare_image.filename)
        uploaded_file_path = os.path.join('uploads',  file_date_prefix + 'upload' + ext)
        try:
            write_stream = file('../' + uploaded_file_path, 'wb')
            while 1:
                chunk = uploaded_file.read(10000)
                if not chunk: break;
                write_stream.write(chunk)
            write_stream.close()
            json_return_obj['uploaded_file'] = {
                'status': 'Success',
                'url': '/' + uploaded_file_path
            }
        except:
            uploaded_file_path = None
            json_return_obj['uploaded_file'] = {
                'status': 'Error',
                'url': 'Couldn\'t write to server'
            }

else:
        json_return_obj['uploaded_file'] = {
            'status': 'Error',
            'url': 'No File to upload'
        }


if form.has_key('website_address'):
    web_url = form["website_address"].value
    shorter_url = web_url.replace('http://', '')
    screenshot_img = autoqa.getPageScreenshot(web_url)
    screenshot_filepath = os.path.join('uploads/', file_date_prefix + 'screenshot.png')

    screenshot_img.save('../' + screenshot_filepath)
    json_return_obj['screenshot'] = {
        'title': shorter_url,
        'status': 'Success',
        'url': '/' + screenshot_filepath
    }



if uploaded_file_path and screenshot_filepath:
    (diff_img, threshold_img, contours_img) = autoqa.compareImages(uploaded_file_path, screenshot_filepath)
    comparison_image_prefix = 'comparisons/'

    cv2.imwrite(os.path.join('..', comparison_image_prefix, file_date_prefix + 'diff_img.png'), diff_img)
    cv2.imwrite(os.path.join('..', comparison_image_prefix, file_date_prefix + 'threshold_img.png'), threshold_img)
    cv2.imwrite(os.path.join('..', comparison_image_prefix, file_date_prefix + 'contours_img.png'), contours_img)
    json_return_obj['comparisons'] = {
        'url': '/' + comparison_image_prefix + file_date_prefix,
        'suffixes': ['diff_img.png', 'threshold_img.png', 'contours_img.png']
    }

json_return_obj['hash'] = file_date_prefix

print JSONEncoder().encode(json_return_obj)
