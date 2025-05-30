from flask import Flask, request, jsonify
from confluent_kafka import Producer
from dotenv import load_dotenv
import os
import json
import atexit

from dba import Dba

load_dotenv()

producer = Producer({ 'bootstrap.servers': os.getenv('KAFKA') })


def send_log(message, level='info'):
    producer.produce('logs', json.dumps({ 'service': 'payment', 'level': level, 'message': message }))


def flush_producer():
    producer.flush()


atexit.register(flush_producer)

app = Flask(__name__)

dba = Dba(
    name=os.getenv('DB_NAME'),
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
)
dba.init_database()


@app.route('/')
def hello_world():
    return 'index'


@app.route('/payment', methods=['POST'])
def add_payment():
    price = request.json['price']
    if price is None or price <= 0:
        return 'Bad price', 400
    uid = dba.add_payment(price)
    send_log(f'POST /payment uid={uid}')
    return jsonify({ 'uid': uid })


@app.route('/payments', methods=['GET', 'POST'])
def get_payments():
    uids = None
    if 'uids' in request.args:
        uids = json.loads(request.args['uids'])
    if request.method == 'POST' and 'uids' in request.json:
        uids = request.json['uids']
    send_log(f'GET/POST /payments uids={json.dumps(uids)}')
    return jsonify(dba.get_payments(uids))


@app.route('/payment/<uid>', methods=['DELETE'])
def cancel_payment(uid):
    if uid is None or len(uid) == 0:
        return 'Bad uid', 400

    dba.cancel_payment(uid)
    send_log(f'DELETE /payment/{uid}')
    return '', 200


@app.route('/manage/health')
def health():
    return 'OK'


if __name__ == '__main__':
    from waitress import serve

    port = os.getenv('APP_PORT')
    print('Start payment on', port)
    send_log(f'Starting')
    serve(app, host='0.0.0.0', port=port)
