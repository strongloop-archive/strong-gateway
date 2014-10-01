// See https://tools.ietf.org/html/draft-ietf-oauth-jwt-bearer-10

var jwt = require('jws');

// Reuse the SSL cert for https. Ideally, we should use a separate key/cert pair
// for JWT
var sslCerts = require('./../private/ssl_cert');

var payload = {
  iss: '123', // issuer - client id
  sub: '123', // subject
  aud: '/oauth/token', // audience
  exp: Date.now() + 10000, // expiration time
  iat: Date.now(), // issued at time
  scope: ['demo'] // a list of oAuth 2.0 scopes
};

var body = {
  header: { alg: 'RS256' },
  privateKey: sslCerts.privateKey,
  payload: payload
}

// Create a JWT assertion
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

