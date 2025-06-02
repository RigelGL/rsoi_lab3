if [ ! -d ".venv-test" ]; then
  echo "Creating venv..."
  python3 -m venv ".venv-test"
  if [ $? -ne 0 ]; then
    echo "Error!"
    exit 1
  fi
  echo "Venv created!"
fi

echo "Activating venv..."
source ".venv-test/bin/activate"

if [ -z "$VIRTUAL_ENV" ]; then
    echo "Ошибка при активации виртуального окружения."
    exit 1
fi


if [ -f "./e2e.requirements.txt" ]; then
  echo "Installing requirements..."
  pip3 install -r "./e2e.requirements.txt"
  if [ $? -ne 0 ]; then
    echo "Error!"
    deactivate
    exit 1
  fi
  echo "Requirements installed!"
fi

docker compose -p e2e down

echo "Run ./e2e.main.py..."
python3 ./e2e.main.py
E2E_EXIT_CODE=$?
echo "Deactivating..."
deactivate

exit $E2E_EXIT_CODE