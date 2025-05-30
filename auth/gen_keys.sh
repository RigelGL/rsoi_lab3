cd ./src
mkdir keys
cd ./keys

rm private_key.pem
rm public_key.pem

openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private_key.pem -out public_key.pem
kubectl delete secret jwt-keys
kubectl create secret generic jwt-keys --from-file=private_key.pem --from-file=public_key.pem