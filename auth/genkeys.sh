KEYS_PATH=${1:-./src/keys}

mkdir -p "$KEYS_PATH"

rm -f "$KEYS_PATH/private_key.pem" "$KEYS_PATH/public_key.pem"

openssl genpkey -algorithm RSA -out "$KEYS_PATH/private_key.pem" -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in "$KEYS_PATH/private_key.pem" -out "$KEYS_PATH/public_key.pem"