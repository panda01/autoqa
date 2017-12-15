import autoqa
import cv2


(diff_img, threshold_img, contours_img) = autoqa.compareImages('../uploads/chrisgreco.staging.wpengine.com.png', '../uploads/17-12-10_13:47:28_d23127d1c5237eaf6dd7ebd0e01cbb42a2b71eeb_screenshot.png');

cv2.imshow('diff', diff_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
