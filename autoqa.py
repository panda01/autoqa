import time
import imutils
import cv2
import numpy
from PIL import Image
from skimage.measure import compare_ssim
from selenium import webdriver
from math import ceil

username = "demo"
password = "password"

scrollRatio = 0.7

def getPageScreenshot(url, image_name="screenshot"):
    viewportWidth = 1280
    viewportHeight = 800
    timer_sleep = 2
    scrollHeight = viewportHeight * scrollRatio
    cOptions = webdriver.chrome.options.Options()
    cOptions.add_argument("--disable-infobars")
    browser = webdriver.Chrome(chrome_options=cOptions)
    browser.set_window_size(viewportWidth, viewportHeight)
    browser.get(url)


    # pause all of the videos
    browser.execute_script("document.querySelectorAll('video').forEach(function(el) {el.pause();})");

    # get the pageheight
    body = browser.find_element_by_css_selector('body')
    pageHeight = float(body.size['height'])

    # init some variable for the loop
    progress = 0;
    i = 1
    while ((progress + viewportHeight) < pageHeight):
        image_path = '%s_%s.png' % (image_name, i)
        time.sleep(timer_sleep)
        print "Making image %s" % image_path
        screenshot = browser.save_screenshot(image_path)
        print progress
        i = i + 1
        progress = progress + scrollHeight
        browser.execute_script("window.scrollTo(0, %s)" % (progress))

    browser.quit();


def getCutImage(image1, image2):
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    h, w = gray1.shape
    h2, w2 = gray2.shape
    height_bounds = min(h, h2)

    scroll_offset = int(h * (1 - scrollRatio))
    curr_overlap = scroll_offset

    while curr_overlap > 0:

        first_image_offset = 0
        print 'Current Overlap: %s' % curr_overlap
        while first_image_offset < curr_overlap:
            cropped_image = gray1[h - (curr_overlap + first_image_offset):h - first_image_offset, 0:w]
            cropped_next_image = gray2[0:curr_overlap, 0:w2]
            print 'First Image Offset: %s' % first_image_offset

            try:
                (score, diff) = compare_ssim(cropped_image, cropped_next_image, full=True)
                print score
            except ValueError as val_error:
                print 'Current Overlap: %s' % curr_overlap
                print 'First Image Offset: %s' % first_image_offset
                print val_error
                exit()
            if score == 1:
                print "found a match with {}% accuracy".format(score * 100)
                cut_image = image1[0:h - (curr_overlap + first_image_offset), 0:w]
                break
            first_image_offset = first_image_offset + 1
        curr_overlap = curr_overlap - 1

    return cut_image

def mergeImages(image_name = "screenshot", viewportHeight = 800):
    images = []
    idx = 1
    image = True
    next_image = True
    while next_image is not None:
        image = cv2.imread('%s_%s.png' % (image_name, idx))
        next_image = cv2.imread('%s_%s.png' % (image_name, idx + 1))
        if idx > 1:
            h, w, scale = image.shape
            image = image[10:h]
        if next_image is None:
            break

        cut_image = getCutImage(image, next_image)
        print 'Adding image to the list'
        images.append(cut_image)
        idx = idx + 1

    images.append(image)

    squashed_img = numpy.concatenate(images, axis=0)
    cv2.imwrite('squashed_%s.png' % image_name, squashed_img)


# Found this on http://www.pyimagesearch.com/2017/06/19/image-difference-with-opencv-and-python/
def compareImages(image1Path, image2Path):
    # grayscale images
    image1 = cv2.imread(image1Path)
    image2 = cv2.imread(image2Path)
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    # Compute the Structural Similarity Index (SSIM)
    (score, diff) = compare_ssim(gray1, gray2, full=True)
    diff = (diff * 255).astype("uint8")
    print "SSIM: %s" % score

    # Find the threshold, and contours
    if imutils.is_cv2():
        print 'This is using opencv2.x'
    thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    contours = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if imutils.is_cv2() else contours[1]


    # Loop over the contours and draw bounding rectangles
    for cont in contours:
        (x, y, w, h) = cv2.boundingRect(cont)
        cv2.rectangle(image2, (x, y), (x + w, y + h), (0, 0, 255), 2)

    # cv2.imshow("Original", image1)
    # cv2.imshow("Modified", image2)
    # cv2.imshow("Diff", diff)
    # cv2.imshow("Thresh", thresh)
    cv2.imwrite('diff_img.png', image2)



# getPageScreenshot('https://demo:password@agileone.staging.wpengine.com', "staging")
# getPageScreenshot('https://demo:password@agileone.wpengine.com', "production")
#getPageScreenshot('http://agileone.localhost.com', "localhost")
mergeImages('localhost')
# compareImages("staging_6.png", "localhost_6.png")
