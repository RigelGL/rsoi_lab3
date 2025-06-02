if docker build . -t dockerhub.rigellab.ru/rsoi/logger; then
    docker push dockerhub.rigellab.ru/rsoi/logger
else
    echo "Error!"
    exit 1
fi