#!/bin/bash

docker build . -t dockerhub.rigellab.ru/rsoi/web
docker push dockerhub.rigellab.ru/rsoi/web