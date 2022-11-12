import time
import picamera
import numpy as np
import cv2

try:
    with picamera.PiCamera() as camera:
        camera.resolution = (2560, 1920)
        camera.framerate = 15
        time.sleep(2)
        image = np.empty((1920 * 2560 * 3,), dtype=np.uint8)
        camera.capture(image, 'bgr')
        time.sleep(2)
        image = image.reshape((1920, 2560, 3))
        name = 'interface'+str(time.time())
        if cv2.imwrite(str('views/img/'+name+'.jpg'), image):
            print(str(name+'.jpg'))
        else:
            exit(1)
except:
    exit(1)
exit(0)