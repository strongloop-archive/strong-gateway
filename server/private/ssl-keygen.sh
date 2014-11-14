#!/bin/bash
KEY_LENGTH=2048
# Generate CA
# openssl genrsa -des3 -out ca.key $KEY_LENGTH
# openssl req -new -key ca.key -out ca.csr
# openssl x509 -req -in ca.csr -out ca.crt -signkey ca.key

# Generate server key
openssl genrsa -passout pass:1234 -des3 -out server.key $KEY_LENGTH
openssl req -passin pass:1234 -new -key server.key -out server.csr
# Remove the passphrase
cp server.key server.key.org
openssl rsa -passin pass:1234 -in server.key.org -out server.key

# Generate server certificate
openssl x509 -req -days 730 -in server.csr -signkey server.key -out server.pem
cp server.pem certificate.pem 
cp server.key privatekey.pem
rm server.pem server.key server.key.org server.csr
