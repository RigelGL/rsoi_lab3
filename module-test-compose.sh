echo "$MODULE_TEST_FOLDER testing..."
docker compose -p "$MODULE_TEST_FOLDER" -f ../module-test-compose.yaml down
docker compose -p "$MODULE_TEST_FOLDER" -f ../module-test-compose.yaml up --build --attach app --exit-code-from app

EXIT_CODE=$?

docker compose -p "$MODULE_TEST_FOLDER" -f ../module-test-compose.yaml down

if [ $EXIT_CODE -ne 0 ]; then
    echo "FAILED! Code: $EXIT_CODE"
    exit 1
else
    echo "OK"
    exit 0
fi