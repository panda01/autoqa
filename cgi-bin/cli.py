import autoqa
import cv2


(diff_img, threshold_img, contours_img) = autoqa.compareImages('uploads/chrisgreco.staging.wpengine.com.png',
        'uploads/17-11-22_19:49:42_chrisgreco.staging.wpengine.com.png');

cv2.imshow('diff', diff_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
