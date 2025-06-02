if docker build . -t dockerhub.rigellab.ru/rsoi/person; then
    docker push dockerhub.rigellab.ru/rsoi/person
else
    echo "Error!"
    exit 1
fi