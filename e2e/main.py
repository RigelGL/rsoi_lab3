import subprocess
from importlib.util import source_hash

import time
import pytest
import requests
from json import dumps
import math

SERVICES = [8020, 8030, 8040, 8050, 8060, 8070, 8080]
LOYALTY_SERVICE_NAME = 'loyalty'

admin_headers = { 'Content-Type': 'application/json' }


@pytest.fixture(scope='module', autouse=True)
def setup_teardown():
    global admin_headers

    subprocess.run(['docker', 'compose', '-p', 'e2e', '-f', 'e2e-compose.yaml', 'up', '--build', '--detach'], check=True)
    for port in SERVICES:
        for attempt in range(600):
            try:
                response = requests.get(f"http://localhost:{port}/manage/health")
                if response.status_code == 200:
                    break
            except requests.ConnectionError:
                pass
            time.sleep(1)
        else:
            raise Exception(f"Service on port {port} didn't become healthy")

    print('[success] no auth')
    res = requests.get('http://localhost:8080/api/v1/hotels?page=1&size=10')
    assert res.status_code == 400

    print('[success] bad token')
    res = requests.get('http://localhost:8080/api/v1/hotels?page=1&size=10', headers={ 'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.a.b' })
    assert res.status_code == 401

    print('[success] authorize')
    res = requests.post('http://localhost:8080/api/v1/authorize', data=dumps({ 'type': 'self', 'login': 'admin', 'password': '123456' }), headers=admin_headers)
    json = res.json()
    assert res.status_code == 200
    admin_headers['Authorization'] = 'Bearer ' + json['jwt']

    print('[success] init mock')
    res = requests.post('http://localhost:8080/api/v1/test/prepare', headers=admin_headers)
    assert res.status_code == 200

    yield

    subprocess.run(['docker', 'compose', '-p', 'e2e', 'down'], check=True)


hotel_uid = '049161bb-badd-4fa8-9d90-87c9a82b0668'
discount = 0
hotel_price = 0
reservation_count = 0
start_date = ''
end_date = ''
reservation_uid = ''


def test_Получение_списка_отелей(setup_teardown):
    global hotel_price
    response = requests.get('http://localhost:8080/api/v1/hotels?page=0&limit=20&search=', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert len(j['items']) > 0
    assert j['pageSize'] == 20
    assert j['totalElements'] > 0
    assert j['page'] >= 0

    hotel = list(filter(lambda x: x['hotelUid'] == hotel_uid, j['items']))[0]
    assert hotel is not None
    assert hotel['hotelUid'] == hotel_uid
    assert hotel['name'] == 'Ararat Park Hyatt Moscow'
    assert hotel['country'] == 'Россия'
    assert hotel['city'] == 'Москва'
    assert hotel['address'] == 'Неглинная ул., 4'
    assert hotel['stars'] == 5
    assert hotel['price'] == 10000
    hotel_price = hotel['price']


def test_Получить_информацию_о_статусе_в_программе_лояльности(setup_teardown):
    global discount, reservation_count
    response = requests.get('http://localhost:8080/api/v1/loyalty', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert len(j['status']) > 0
    assert j['discount'] > 0
    assert j['reservationCount'] >= 0
    assert j['reservationCount'] >= 0
    discount = j['discount']
    reservation_count = j['reservationCount']


def test_Забронировать_отель(setup_teardown):
    global reservation_count, start_date, end_date, reservation_uid
    response = requests.post(
        'http://localhost:8080/api/v1/reservations',
        headers=admin_headers,
        data=dumps({
            'hotelUid': hotel_uid,
            'startDate': '2021-10-08',
            'endDate': '2021-10-11',
        }))
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['reservationUid'] is not None
    assert j['startDate'] == '2021-10-08'
    assert j['endDate'] == '2021-10-11'
    assert j['discount'] == discount
    assert j['status'] == 'PAID'
    assert j['payment'] is not None
    assert j['payment']['status'] == 'PAID'
    assert j['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))
    start_date = j['startDate']
    end_date = j['endDate']
    reservation_uid = j['reservationUid']


def test_Информация_по_конкретному_бронированию(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/reservations/{reservation_uid}', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['reservationUid'] == reservation_uid
    assert j['hotel'] is not None
    assert j['hotel']['hotelUid'] == hotel_uid
    assert j['hotel']['name'] == 'Ararat Park Hyatt Moscow'
    assert j['hotel']['fullAddress'] == 'Россия, Москва, Неглинная ул., 4'
    assert j['hotel']['stars'] == 5
    assert j['startDate'] == start_date
    assert j['endDate'] == end_date
    assert j['payment'] is not None
    assert j['payment']['status'] == 'PAID'
    assert j['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))


def test_Информация_по_всем_бронированиям_пользователя(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/reservations', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert type(j) == list
    assert len(j) >= 1
    reservation = list(filter(lambda x: x['reservationUid'] == reservation_uid, j))[0]
    assert reservation['reservationUid'] == reservation_uid
    assert reservation['hotel'] is not None
    assert reservation['hotel']['hotelUid'] == hotel_uid
    assert reservation['hotel']['name'] == 'Ararat Park Hyatt Moscow'
    assert reservation['hotel']['fullAddress'] == 'Россия, Москва, Неглинная ул., 4'
    assert reservation['hotel']['stars'] == 5
    assert reservation['startDate'] == start_date
    assert reservation['endDate'] == end_date
    assert reservation['status'] == 'PAID'
    assert reservation['payment'] is not None
    assert reservation['payment']['status'] == 'PAID'
    assert reservation['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))


def test_Информация_о_пользователе(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/me', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['reservations'] is not None
    assert len(j['reservations']) >= 1
    reservation = list(filter(lambda x: x['reservationUid'] == reservation_uid, j['reservations']))[0]
    assert reservation['reservationUid'] == reservation_uid
    assert reservation['hotel'] is not None
    assert reservation['hotel']['hotelUid'] == hotel_uid
    assert reservation['hotel']['name'] == 'Ararat Park Hyatt Moscow'
    assert reservation['hotel']['fullAddress'] == 'Россия, Москва, Неглинная ул., 4'
    assert reservation['hotel']['stars'] == 5
    assert reservation['startDate'] == start_date
    assert reservation['endDate'] == end_date
    assert reservation['status'] == 'PAID'
    assert reservation['payment'] is not None
    assert reservation['payment']['status'] == 'PAID'
    assert reservation['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))

    assert j['loyalty'] is not None
    assert j['loyalty']['status'] is not None
    assert j['loyalty']['discount'] == discount


def test_Получить_информацию_о_статусе_в_программе_лояльности_после_бронирования(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/loyalty', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert len(j['status']) > 0
    assert j['discount'] > 0
    assert j['reservationCount'] == reservation_count + 1


def test_Отменить_бронирование(setup_teardown):
    response = requests.delete(f'http://localhost:8080/api/v1/reservations/{reservation_uid}', headers=admin_headers)
    assert response.status_code == 204

def test_step1(setup_teardown):
    subprocess.run(['docker', 'compose', '-p', 'e2e', 'stop', 'loyalty'], check=True)
    time.sleep(5)

def test_step1_Получить_список_отелей(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/hotels?page=1&limit=20&search=', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert len(j['items']) > 0
    assert j['page'] >= 0
    assert j['pageSize'] == 20
    assert j['totalElements'] > 0

    hotel = list(filter(lambda x: x['hotelUid'] == hotel_uid, j['items']))[0]
    assert hotel['hotelUid'] == hotel_uid
    assert hotel['name'] == 'Ararat Park Hyatt Moscow'
    assert hotel['country'] == 'Россия'
    assert hotel['city'] == 'Москва'
    assert hotel['address'] =='Неглинная ул., 4'
    assert hotel['stars'] == 5
    assert hotel['price'] == 10000

def test_step1_Получить_информацию_о_статусе_в_программе_лояльности(setup_teardown):
    response = requests.get('http://localhost:8080/api/v1/loyalty', headers=admin_headers)
    assert response.status_code == 503
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['error'] == 'Loyalty Service unavailable'

def test_step1_Информация_о_пользователе(setup_teardown):
    response = requests.get('http://localhost:8080/api/v1/me', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert type(j['reservations']) == list
    assert j['loyalty']['reservationCount'] == 0

def test_step1_Забронировать_отель(setup_teardown):
    response = requests.post(
        'http://localhost:8080/api/v1/reservations',
        headers=admin_headers,
        data=dumps({
            'hotelUid': hotel_uid,
            'startDate': '2021-10-08',
            'endDate': '2021-10-11',
        }))
    assert response.status_code == 503
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['message'] == 'Loyalty Service unavailable'

def test_step2(setup_teardown):
    subprocess.run(['docker', 'compose', '-p', 'e2e', 'start', 'loyalty'], check=True)
    time.sleep(10)

def test_step2_Получить_информацию_о_статусе_в_программе_лояльности(setup_teardown):
    global reservation_count
    response = requests.get('http://localhost:8080/api/v1/loyalty', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert len(j['status']) > 0
    assert j['discount'] > 0
    assert j['reservationCount'] >= 0
    reservation_count = j['reservationCount']

def test_step2_Забронировать_отель(setup_teardown):
    global reservation_count, start_date, end_date, reservation_uid
    response = requests.post(
        'http://localhost:8080/api/v1/reservations',
        headers=admin_headers,
        data=dumps({
            'hotelUid': hotel_uid,
            'startDate': '2021-10-08',
            'endDate': '2021-10-11',
        }))
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['reservationUid'] is not None
    assert j['startDate'] == '2021-10-08'
    assert j['endDate'] == '2021-10-11'
    assert j['discount'] == discount
    assert j['status'] == 'PAID'
    assert j['payment'] is not None
    assert j['payment']['status'] == 'PAID'
    assert j['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))
    start_date = j['startDate']
    end_date = j['endDate']
    reservation_uid = j['reservationUid']

def test_step2_Информация_по_конкретному_бронированию(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/reservations/{reservation_uid}', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['reservationUid'] == reservation_uid
    assert j['hotel'] is not None
    assert j['hotel']['hotelUid'] == hotel_uid
    assert j['hotel']['name'] == 'Ararat Park Hyatt Moscow'
    assert j['hotel']['fullAddress'] == 'Россия, Москва, Неглинная ул., 4'
    assert j['hotel']['stars'] == 5
    assert j['startDate'] == start_date
    assert j['endDate'] == end_date
    assert j['payment'] is not None
    assert j['payment']['status'] == 'PAID'
    assert j['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))


def test_step2_Информация_по_всем_бронированиям_пользователя(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/reservations', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert type(j) == list
    assert len(j) >= 1
    reservation = list(filter(lambda x: x['reservationUid'] == reservation_uid, j))[0]
    assert reservation['reservationUid'] == reservation_uid
    assert reservation['hotel'] is not None
    assert reservation['hotel']['hotelUid'] == hotel_uid
    assert reservation['hotel']['name'] == 'Ararat Park Hyatt Moscow'
    assert reservation['hotel']['fullAddress'] == 'Россия, Москва, Неглинная ул., 4'
    assert reservation['hotel']['stars'] == 5
    assert reservation['startDate'] == start_date
    assert reservation['endDate'] == end_date
    assert reservation['status'] == 'PAID'
    assert reservation['payment'] is not None
    assert reservation['payment']['status'] == 'PAID'
    assert reservation['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))


def test_step3(setup_teardown):
    subprocess.run(['docker', 'compose', '-p', 'e2e', 'stop', 'loyalty'], check=True)
    time.sleep(5)

def test_step3_Получить_информацию_о_статусе_в_программе_лояльности():
    response = requests.get('http://localhost:8080/api/v1/loyalty', headers=admin_headers)
    assert response.status_code == 503
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['error'] == 'Loyalty Service unavailable'

def test_step3_Отменить_бронирование(setup_teardown):
    response = requests.delete(f'http://localhost:8080/api/v1/reservations/{reservation_uid}', headers=admin_headers)
    assert response.status_code == 204

def test_step4():
    subprocess.run(['docker', 'compose', '-p', 'e2e', 'start', 'loyalty'], check=True)
    time.sleep(60)

def test_step4_Получить_информацию_о_статусе_в_программе_лояльности_после_бронирования(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/loyalty', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert len(j['status']) > 0
    assert j['discount'] > 0
    assert j['reservationCount'] == reservation_count

def test_step4_Информация_по_конкретному_бронированию(setup_teardown):
    response = requests.get(f'http://localhost:8080/api/v1/reservations/{reservation_uid}', headers=admin_headers)
    assert response.status_code == 200
    assert 'application/json' in response.headers['Content-Type']
    j = response.json()
    assert j['reservationUid'] == reservation_uid
    assert j['hotel'] is not None
    assert j['hotel']['hotelUid'] == hotel_uid
    assert j['hotel']['name'] == 'Ararat Park Hyatt Moscow'
    assert j['hotel']['fullAddress'] == 'Россия, Москва, Неглинная ул., 4'
    assert j['hotel']['stars'] == 5
    assert j['startDate'] == start_date
    assert j['endDate'] == end_date
    assert j['status'] == 'CANCELED'
    assert j['payment'] is not None
    assert j['payment']['status'] == 'CANCELED'
    assert j['payment']['price'] == 4 * math.ceil(hotel_price * (1 - discount / 100))
