var jwt = require('jwt-simple');
var sslCerts = require('./private/ssl_cert');

var payload = {
  iss: '123',
  scope: ['demo']
};

var assertion = jwt.encode(payload, sslCerts.privateKey, 'RS256');

console.log(assertion);

var form = {
  grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  assertion: assertion
}

var request = require('request');
request.post({
  url: 'https://localhost:3001/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  strictSSL: false,
  form: form
}, function(err, res, body) {
  console.log(err, body);
});

