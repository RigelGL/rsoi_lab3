if docker build . -t dockerhub.rigellab.ru/rsoi/gateway; then
    docker push dockerhub.rigellab.ru/rsoi/gateway
else
    echo "Error!"
    exit 1
fi