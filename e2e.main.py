import asyncio
import os
import subprocess
from typing import List
from json import dumps
import sys

import requests


def expect(expected, real):
    if real != expected:
        raise RuntimeError('Expected "{}" but got "{}"'.format(expected, real))


def expect_true(real):
    expect(True, real)


async def wait_for_port(port: str, error_flag: List[bool]) -> None:
    print(f"Wait {port}")
    for i in range(1, 3):
        if error_flag[0]:
            return

        await asyncio.sleep(5)

        try:
            response = requests.get(f"http://localhost:{port}/manage/health", timeout=0.1)
            if response.status_code == 200:
                print(f"READY: {port}")
                return
        except requests.exceptions.RequestException as e:
            print(f"Error checking health on port {port}: {e}")


async def test_main(error: List[bool]) -> None:
    print('[success] no auth')
    res = requests.get('http://localhost:8080/api/v1/hotels?page=1&size=10')
    expect(400, res.status_code)

    print('[success] bad token')
    res = requests.get('http://localhost:8080/api/v1/hotels?page=1&size=10', headers={ 'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.a.b' })
    expect(401, res.status_code)

    print('[success] authorize')
    res = requests.post('http://localhost:8080/api/v1/authorize', data=dumps({ 'type': 'self', 'login': 'admin', 'password': '123456' }), headers={ 'Content-Type': 'application/json' })
    json = res.json()
    print(json)
    expect(200, res.status_code)
    headers = { 'Authorization': 'Bearer ' + json['jwt'], 'Content-Type': 'application/json; charset=utf-8' }

    print('[success] init mock')
    res = requests.post('http://localhost:8080/api/v1/test/prepare', headers=headers)
    expect(200, res.status_code)

    print('[success] Получить список отелей')
    res = requests.get('http://localhost:8080/api/v1/hotels?page=1&size=10', headers=headers)
    json = res.json()
    expect(200, res.status_code)
    expect_true('application/json' in res.headers['Content-Type'])
    expect(list, type(json['items']))
    expect_true(len(json['items']) >= 0)
    expect(1, json['page'])
    expect_true(json['totalElements'] >= 0)


async def main():
    print("start tests")

    error = [False]
    os.system('docker compose -p e2e -f ./e2e-compose.yaml up --build --detach')
    await asyncio.gather(*(wait_for_port(port, error) for port in '8020 8030 8040 8050 8060 8070 8080'.split()))

    if not error[0]:
        await test_main(error)
        # try:
        # except Exception as e:
        #     print(e)
        #     error[0] = True

    print("Running docker compose down...")
    try:
        result = subprocess.run(['docker', 'compose', '-p', 'e2e', 'down'], capture_output=True, text=True, check=True)
        print(f"docker compose down stdout: {result.stdout}")
    except subprocess.CalledProcessError as e:
        print(f"Error running docker compose down: {e.stderr}")

    if error[0]:
        print('Error')
        sys.exit(1)

    print("Finished!")


if __name__ == "__main__":
    asyncio.run(main())
