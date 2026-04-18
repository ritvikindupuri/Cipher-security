import urllib.request
import json
import time

try:
    urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:5000/api/execute', method='POST'))
    time.sleep(2)
    response = urllib.request.urlopen('http://127.0.0.1:5000/api/status')
    print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
