if docker build . -t dockerhub.rigellab.ru/rsoi/loyalty; then
    docker push dockerhub.rigellab.ru/rsoi/loyalty
else
    echo "Error!"
    exit 1
fi