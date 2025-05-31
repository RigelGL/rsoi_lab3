#!/bin/bash

cd ./auth
./publish.sh

cd ../gateway
./publish.sh

cd ../logger
./publish.sh

cd ../loyalty
./publish.sh

cd ../payment
./publish.sh

cd ../person
./publish.sh

cd ../reservation
./publish.sh

cd ../web
./publish.sh