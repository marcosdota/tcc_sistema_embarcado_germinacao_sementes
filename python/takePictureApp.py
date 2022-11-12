import time
import picamera
import numpy as np
import cv2
import RPi.GPIO as GPIO

#defines
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
# define green color range
light_green = np.array([40,24,156])
dark_green = np.array([73,255,255])
# LED GPIO
led = 23
GPIO.setup(led, GPIO.OUT, initial=GPIO.LOW) #0

constGerminated = 90

def takePicture(directory, lightLevel, horizontal_cells, vertical_cells, cell_position_x, cell_position_y, cell_length, cell_width):
    horizontal_cells = int(horizontal_cells)
    vertical_cells = int(vertical_cells)
    cell_position_x = int(cell_position_x)
    cell_position_y = int(cell_position_y)
    cell_length = int(cell_length)
    cell_width = int(cell_width)
    posX = cell_position_x
    posY = cell_position_y
    
    try:
        with picamera.PiCamera() as camera:
            if lightLevel < 100:
                GPIO.output(led, 1)
                time.sleep(0.2)
            camera.resolution = (2560, 1920)
            camera.framerate = 15
            time.sleep(2)
            image = np.empty((1920 * 2560 * 3,), dtype=np.uint8)
            camera.capture(image, 'bgr')
            time.sleep(2)
            GPIO.output(led, 0)
            image = image.reshape((1920, 2560, 3))
            if cv2.imwrite(str(directory+'/source.jpg'), image):
                
                # Convert BGR to HSV
                hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

                # Threshold the HSV image to get only green colors
                mask = cv2.inRange(hsv, light_green, dark_green)

                # Bitwise-AND mask and original image
                output = cv2.bitwise_and(image,image, mask= mask)

                grayImage = cv2.cvtColor(output, cv2.COLOR_BGR2GRAY)
                (thresh, blackAndWhiteImage) = cv2.threshold(grayImage, 127, 255, cv2.THRESH_BINARY)
                
                #saving clipping
                cells_germinated = []
                horizontal_cells_germinated = []

                for r_y in range(0, vertical_cells):
                    for r_x in range(0, horizontal_cells):
                        crop_img = image[posY:(posY+cell_width), posX:(posX+cell_length)]
                        crop_img2 = blackAndWhiteImage[posY:(posY+cell_width), posX:(posX+cell_length)]
                        
                        #rectangle red
                        se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(1, 1))
                        crop_img2 = cv2.morphologyEx(crop_img2, cv2.MORPH_DILATE, se)
                        crop_img2 = cv2.morphologyEx(crop_img2, cv2.MORPH_CLOSE, se)

                        contours, hierarchy = cv2.findContours(crop_img2,cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

                        x = []
                        m = 0
                        for eachCOntor in contours:
                            x.append(len(eachCOntor))
                        if(len(x)>0):
                            m = max(x)
                        #print(m)

                        if m >= constGerminated:
                            p = [i for i, j in enumerate(x) if j == m]

                            color = (0, 0, 255)
                            x, y, w, h = cv2.boundingRect(contours[p[0]])
                            x -=10
                            y -=10
                            w +=20
                            h +=20
                            cv2.rectangle(crop_img, (x,y),(x+w,y+h),color, 3)
                            horizontal_cells_germinated.append(True)
                        else:
                            horizontal_cells_germinated.append(False)

                        posX = posX+cell_length

                    cells_germinated.append(horizontal_cells_germinated)
                    horizontal_cells_germinated = []
                    posY = posY+cell_width
                    posX = cell_position_x

                return cells_germinated
            else:
                return []
    except:
        return []
