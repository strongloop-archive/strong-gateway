var crypto = require('crypto');
var fs = require("fs");
var path = require('path');

// Read the SSL private key and certificate
exports.privateKey = fs.readFileSync(path.join(__dirname, 'privatekey.pem'), {encoding: 'UTF-8'});
exports.certificate = fs.readFileSync(path.join(__dirname, 'certificate.pem'), {encoding: 'UTF-8'});

exports.credentials = crypto.createCredentials({key: exports.privateKey, cert: exports.certificate});
