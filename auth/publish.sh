if docker build . -t dockerhub.rigellab.ru/rsoi/auth; then
    docker push dockerhub.rigellab.ru/rsoi/auth
else
    echo "Error!"
    exit 1
fi