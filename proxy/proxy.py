from flask import Flask
from requests import get

app = Flask('__main__')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def proxy(path):
    return get(f'http://{path}').content

app.run(host='0.0.0.0', port=8080)
