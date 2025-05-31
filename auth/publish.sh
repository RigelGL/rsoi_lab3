#!/bin/bash

docker build . -t dockerhub.rigellab.ru/rsoi/auth
docker push dockerhub.rigellab.ru/rsoi/auth