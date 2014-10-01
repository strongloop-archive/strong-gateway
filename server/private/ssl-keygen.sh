#!/bin/bash
KEY_LENGTH=2048
# Generate CA
# openssl genrsa -des3 -out ca.key $KEY_LENGTH
# openssl req -new -key ca.key -out ca.csr
# openssl x509 -req -in ca.csr -out ca.crt -signkey ca.key

# Generate server key
openssl genrsa -des3 -out server.key $KEY_LENGTH
openssl req -new -key server.key -out server.csr
# Remove the passphrase
cp server.key server.key.org
openssl rsa -in server.key.org -out server.key
rm server.key.org

# Generate server certificate
openssl x509 -req -days 730 -in server.csr -signkey server.key -out server.pem
rm server.csr
cp server.pem certificate.pem 
cp server.key privatekey.pem
