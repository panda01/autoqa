#!/usr/bin/python

import os
import time
import imutils
import cv2
import numpy
import argparse
import cgi
from PIL import Image
from skimage.measure import compare_ssim
from selenium import webdriver
from math import ceil
from pyvirtualdisplay import Display



# https://seleniumpythonqa.blogspot.com/2015/08/generate-full-page-screenshot-in-chrome.html
def getPageScreenshot(url, image_name="screenshot", driver="chrome", viewportWidth=1280, viewportHeight=800, loadingWait=0):

    display = Display(visible=0, size=(viewportWidth, viewportHeight))
    display.start()
    # setup some options
    if( driver == 'chrome' ):
        cOptions = webdriver.chrome.options.Options()
        cOptions.add_argument("--disable-infobars --no-sandbox")
        webDriver = webdriver.Chrome("/usr/local/bin/chromedriver", chrome_options=cOptions)

    elif( driver == 'firefox' ):
        fp = FirefoxProfile()
        capabilities = DesiredCapabilities.firefox()
        capabilities.setCapability(FirefoxDriver.PROFILE, fp)
        webDriver = webdriver.Firefox()


    webDriver.set_window_size(viewportWidth, viewportHeight)
    actual_height = webDriver.execute_script('return window.innerHeight')
    height_diff = viewportHeight - actual_height
    if height_diff > 0:
        webDriver.set_window_size(viewportWidth, viewportHeight + height_diff)

    try:
        webDriver.get(url)
    except: 
        print "Content-type: text/html\n\n"
        print "Something went wrong with the request"

    if(loadingWait > 0):
        time.sleep(loadingWait)

    # pause all of the videos
    # webDriver.execute_script("document.querySelectorAll('video').forEach(function(el) {el.pause();})");

    screenshot_image = fullpageScreenshot(webDriver, image_name)

    time.sleep(5)
    webDriver.quit()

    if screenshot_image:
        return screenshot_image
    else:
        return False


# Heavily Inspired by:
# https://seleniumpythonqa.blogspot.com/2015/08/generate-full-page-screenshot-in-chrome.html
def fullpageScreenshot(driver, file = "temp_image"):

    total_width = driver.execute_script('return document.body.offsetWidth')
    total_height = driver.execute_script('return document.body.parentNode.scrollHeight')
    viewport_width = driver.execute_script('return document.body.clientWidth')
    viewport_height = driver.execute_script('return window.innerHeight')
    devicePixelRatio = driver.execute_script('return window.devicePixelRatio')

    rectangles = []

    i = 0
    while i < total_height:
        ii = 0
        top_height = i + viewport_height

        if top_height > total_height:
            top_height = total_height

        while ii < total_width:
            top_width = ii + viewport_width

            if top_width > total_width:
                top_width = total_width

            rectangles.append((ii, i, top_width, top_height))

            ii = ii + viewport_width

        i = i + viewport_height

    stiched_image = Image.new('RGB', (total_width * devicePixelRatio , total_height * devicePixelRatio ))
    previous = None
    part = 0

    for rectangle in rectangles:
        if not previous is None:
            driver.execute_script('window.scrollTo({0}, {1})'.format(rectangle[0], rectangle[1]))
            driver.execute_script("document.querySelectorAll('header').forEach(function(el) {el.style.display = 'none'})");
            time.sleep(0.7)

        file_name = '{}_part_{}.png'.format(file, part)

        driver.get_screenshot_as_file(file_name)
        screenshot = Image.open(file_name)

        if rectangle[1] + viewport_height > total_height:
            offset = (rectangle[0], total_height - viewport_height)
        else:
            offset = (rectangle[0], rectangle[1])

        offset = (offset[0] * devicePixelRatio, offset[1] * devicePixelRatio)
        stiched_image.paste(screenshot, offset)

        del screenshot
        os.remove(file_name)
        part = part + 1
        previous = rectangle

    stiched_image.resize((total_width, total_height))
    return stiched_image




# http://docs.opencv.org/trunk/d7/d4d/tutorial_py_thresholding.html
# Found this on http://www.pyimagesearch.com/2017/06/19/image-difference-with-opencv-and-python/
def compareImages(image1Path, image2Path, area_threshold = 10):
    # grayscale images
    image1 = cv2.imread(os.path.abspath('../' + image1Path), 1)
    image2 = cv2.imread(os.path.abspath('../' + image2Path), 1)
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    h1, w1 = gray1.shape
    h2, w2 = gray2.shape

    minimum_height = min(h1, h2)

    gray1 = gray1[0:minimum_height]
    gray2 = gray2[0:minimum_height]

    # Compute the Structural Similarity Index (SSIM)
    (score, diff) = compare_ssim(gray1, gray2, full=True)
    diff = (diff * 255).astype("uint8")

    # Find the threshold, and contours
    thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    contours = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if imutils.is_cv2() else contours[1]


    # Loop over the contours and draw bounding rectangles
    for cont in contours:
        (x, y, w, h) = cv2.boundingRect(cont)
        if w * h > area_threshold * area_threshold:
            cv2.rectangle(image2, (x, y), (x + w, y + h), (0, 0, 255), 2)

    return (thresh, diff, image2)
