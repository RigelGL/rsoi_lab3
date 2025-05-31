#!/bin/bash

if ! minikube status &> /dev/null; then
  echo "Minikube is not running. Starting..."
  minikube start
  if [ $? -eq 0 ]; then
    echo "Minikube run."
  else
    echo "Minikube run error!"
    exit 1
  fi
else
  echo "Minikube is running"
fi

cd ./charts
echo "Install ingress"
minikube addons enable ingress

echo "Remove old"
helm uninstall rsoi-postgres
helm uninstall rsoi-kafka
helm uninstall rsoi-loyalty
helm uninstall rsoi-auth
helm uninstall rsoi-payment
helm uninstall rsoi-person
helm uninstall rsoi-reservation
helm uninstall rsoi-gateway
helm uninstall rsoi-web

echo "Wait..."
sleep 5

echo "install all"
helm install rsoi-postgres . -f ./values-postgres.yaml --wait --atomic
helm install rsoi-kafka . -f values-kafka.yaml --wait --atomic
helm install rsoi-loyalty . -f ./values-loyalty.yaml --wait --atomic
helm install rsoi-auth . -f ./values-auth.yaml --wait --atomic
helm install rsoi-payment . -f ./values-payment.yaml --wait --atomic
helm install rsoi-person . -f ./values-person.yaml --wait --atomic
helm install rsoi-reservation . -f ./values-reservation.yaml --wait --atomic
helm install rsoi-gateway . -f ./values-gateway.yaml --wait --atomic
helm install rsoi-web . -f ./values-web.yaml --wait --atomic

echo "apply ingress"
kubectl apply -f ./ingress.yaml