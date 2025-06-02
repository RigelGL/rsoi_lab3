KEYS_PATH=${KEYS_PATH:-/app/keys}
mkdir -p "$KEYS_PATH"

if [ ! -f "$KEYS_PATH/private_key.pem" ] || [ ! -f "$KEYS_PATH/public_key.pem" ]; then
  echo "Keys not found, generating..."
  ./genkeys.sh "$KEYS_PATH"
else
  echo "Keys found, skipping generation"
fi

exec node dist/main.js