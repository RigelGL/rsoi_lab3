from flask import Flask, request, jsonify
from flasgger import Swagger
from dotenv import load_dotenv
import os
import json

from dba import Dba

load_dotenv()

app = Flask(__name__)
swagger = Swagger(app)

dba = Dba(
    name=os.getenv('DB_NAME'),
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
)
dba.init_database()


@app.route('/')
def hello_world():
    """Index endpoint.
        ---
        responses:
          200:
            description: Index endpoint.
        """
    return 'index'


@app.route('/payment', methods=['POST'])
def add_payment():
    """Add payment
        ---
        parameters:
          - name: price
            in: body
            type: integer
            required: true
        responses:
          200:
            description: Payment's uid
            schema:
              type: object
              properties:
                uid:
                  type: string
            examples:
              uid: 'asd'
        """

    price = request.json['price']
    if price is None or price <= 0:
        return 'Bad price', 400
    uid = dba.add_payment(price)
    return jsonify({'uid': uid})


@app.route('/payment/<uid>', methods=['GET'])
def get_payment(uid):
    """Full payment info
        ---
        parameters:
          - name: uid
            in: path
            type: string
            required: true
        responses:
          200:
            description: Payment info
            schema:
              type: object
              properties:
                uid:
                  type: string
                status:
                  type: string
                  enum: ['PAID', 'CANCELED']
                price:
                  type: integer
          400:
            description: Bad uid
          404:
            description: Payment info not found
        """
    if uid is None or len(uid) == 0:
        return 'Bad uid', 400
    p = dba.get_payment(uid)
    if p is None:
        return 'Payment not found', 404
    return jsonify(p)


@app.route('/payments', methods=['GET', 'POST'])
def get_payments():
    uids = None
    if 'uids' in request.args:
        uids = json.loads(request.args['uids'])
    if request.method == 'POST' and 'uids' in request.json:
        uids = request.json['uids']
    return jsonify(dba.get_payments(uids))


@app.route('/payment/<uid>', methods=['DELETE'])
def cancel_payment(uid):
    """Delete payment.
        ---
        parameters:
          - name: uid
            in: path
            type: string
            required: true
        responses:
          200:
            description: Deleted
          400:
            description: Bad uid
        """

    if uid is None or len(uid) == 0:
        return 'Bad uid', 400

    dba.cancel_payment(uid)

    return '', 200


@app.route('/manage/health')
def health():
    """Health.
        ---
        responses:
          200:
            description: Server works
        """
    return 'OK'


if __name__ == '__main__':
    from waitress import serve

    port = os.getenv('APP_PORT')
    print('Start payment on', port)
    serve(app, host='0.0.0.0', port=port)
