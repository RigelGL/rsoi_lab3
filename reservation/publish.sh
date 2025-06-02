if docker build . -t dockerhub.rigellab.ru/rsoi/reservation; then
    docker push dockerhub.rigellab.ru/rsoi/reservation
else
    echo "Error!"
    exit 1
fi