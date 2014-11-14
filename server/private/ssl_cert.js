var crypto = require('crypto'),
  fs = require("fs"),
  path = require('path');

exports.privateKey = fs.readFileSync(path.join(__dirname, 'privatekey.pem')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, 'certificate.pem')).toString();

exports.credentials = crypto.createCredentials({key: exports.privateKey, cert: exports.certificate});
