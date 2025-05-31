#!/bin/bash

docker build . -t dockerhub.rigellab.ru/rsoi/payment
docker push dockerhub.rigellab.ru/rsoi/payment