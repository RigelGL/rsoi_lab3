if docker build . -t dockerhub.rigellab.ru/rsoi/web; then
    docker push dockerhub.rigellab.ru/rsoi/web
else
    echo "Error!"
    exit 1
fi