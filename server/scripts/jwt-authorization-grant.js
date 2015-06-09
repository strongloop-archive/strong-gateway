// See https://tools.ietf.org/html/draft-ietf-oauth-jwt-bearer-10
/* jshint camelcase: false */
var jwt = require('jws');
var sslCerts = require('./../private/ssl_cert');

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
};

var assertion = jwt.sign(body);

console.log(assertion);

var code = process.argv[2];
if (!code) {
  console.log('Usage: %s %s %s', process.argv[0],
    process.argv[1], '<authorization_code>');
  process.exit(1);
}
console.log('code: ', code);

var form = {
  grant_type: 'authorization_code',
  code: code || 'invalid_code_123',
  client_assertion_type:
    'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: assertion
};

var port = process.env.PORT || 3001;
var request = require('request');
request.post({
  url: 'https://localhost:' + port + '/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  strictSSL: false,
  form: form
}, function(err, res, body) {
  console.log(err, body);
});

