var jwt = require('jws');
var sslCerts = require('./private/ssl_cert');

var payload = {
  iss: '123',
  sub: '123', // client id
  aud: '/oauth/token',
  exp: Date.now() + 10000,
  iat: Date.now(),
  scope: ['demo']
};

var body = {
  header: { alg: 'RS256' },
  privateKey: sslCerts.privateKey,
  payload: payload
}

var assertion = jwt.sign(body);

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

