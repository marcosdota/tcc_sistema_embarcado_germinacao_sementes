from http.client import HTTP_PORT
import threading
import time
import socketio
import sys
from pathlib import Path
import RPi.GPIO as GPIO

import bh1750
import CSMS_1 as CSMS
import temperature as DHT22TH
import takePictureApp as Picture
import DB

# global variables
sio = socketio.Client()
mutex = threading.Lock()
stop_threads = False
threads = []
HTTP_PORT = 3000
id_experiment = -1

def end_threads():
    global stop_threads, threads
    stop_threads = True
    for thread in threads:
        thread.join()

# analyze photo
#print(sys.argv[0]) -> path
#print(sys.argv[1]) -> id_experiment
#print(sys.argv[2]) -> horizontal_cells
#print(sys.argv[3]) -> vertical_cells
#print(sys.argv[4]) -> cell_position_x
#print(sys.argv[5]) -> cell_position_y
#print(sys.argv[6]) -> cell_length
#print(sys.argv[7]) -> cell_width
#print(sys.argv[8]) -> ref_csms0, 
#print(sys.argv[9]) -> ref_csms1
def Thread1(id, stop):
    global id_experiment 
    while True:
        if stop():
            print("Exiting Thread 1.")
            break
        with mutex:
            lightLevel = bh1750.readLight()
        
        #mkdir
        d = str("data/experiment"+id_experiment+"/capturing")
        p = Path(d)
        p.mkdir(parents=True, exist_ok=True)
        germinated_seeds = Picture.takePicture(d,lightLevel,sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5],sys.argv[6],sys.argv[7])
        print(germinated_seeds)
        id_data = DB.insert_germinated_seeds(id_experiment, germinated_seeds)
        id_data = str(id_data)
        d = str("data/experiment"+id_experiment+"/capture_"+id_data)
        d = Path(d)
        p.rename(d)
        print("I am thread 1 doing nothing")
        time.sleep(14400)

# acquire data


def Thread2(id, stop):
    while True:
        if stop():
            print("Exiting thread 2")
            break
        with mutex:
            #try:
            lightLevel = bh1750.readLight()
            time.sleep(0.5)
            csmsLevel = CSMS.readCSMS()
            time.sleep(0.5)
            th = DHT22TH.readTH()
            DB.insert_sensor_data(id, th[0], th[1], csmsLevel, lightLevel, [])
            time.sleep(2)
            #except Exception as error:
                #print("erro")
                #print(error)
        print("I am thread 2 doing something")
        time.sleep(600)

# Socket Events


@sio.on('disconnectApp')
def on_message(data):
    if data == 0:
        end_threads()
        sio.disconnect()
        GPIO.cleanup()
        exit(0)
    elif data == 1:
        end_threads()
        sio.disconnect()
        GPIO.cleanup()
        exit(1)


@sio.event
def connect_error(data):
    end_threads()
    GPIO.cleanup()
    exit(0)


@sio.event
def disconnect():
    end_threads()
    GPIO.cleanup()
    exit(0)

# Main


def main():

    global stop_threads, threads, HTTP_PORT, id_experiment
    id_experiment = sys.argv[1]
    #id_experiment = "11"
    
    #mkdir
    p = Path(str("data/experiment"+id_experiment))
    p.mkdir(parents=True, exist_ok=True)

    t1 = threading.Thread(target=Thread1, args=(id_experiment, lambda: stop_threads))
    t1.start()
    threads.append(t1)

    t2 = threading.Thread(target=Thread2, args=(id_experiment, lambda: stop_threads))
    t2.start()
    threads.append(t2)

    sio.connect('http://localhost:'+str(HTTP_PORT))


if __name__ == '__main__':
    main()
