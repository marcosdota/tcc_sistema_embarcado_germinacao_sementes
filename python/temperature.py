import time
import board
import adafruit_dht

dhtDevice = adafruit_dht.DHT22(board.D4, use_pulseio=False)

def readTH():
    succes=False
    tries=15
    temperature = -1
    humidity = -1
    while (succes == False and tries > 0):
        try:
            temperature = dhtDevice.temperature
            humidity    = dhtDevice.humidity
            succes=True
        except:
            tries-=1
            time.sleep(2)
    return ([temperature,humidity])

            
