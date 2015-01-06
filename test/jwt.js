/* jshint camelcase: false */

var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';

var loopback = require('loopback');

describe('JTW client authentication', function() {

  before(function(done) {
    app.once('started', done);
    app.start();
  });

  // Hacky way to create an authorization code
  before(function(done) {
    var model = loopback.getModel('OAuthAuthorizationCode');
    model.create({
      id: 'abc123',
      scopes: ['demo'],
      userId: 1,
      appId: '123',
      issuedAt: new Date(),
      expiredAt: new Date(Date.now() + 1000)
    }, done);
  });

  after(function(done) {
    app.close(done);
  });

  var jwt = require('jws');

// Reuse the SSL cert for https. Ideally, we should use a separate key/cert pair
// for JWT
  var sslCerts = require('../server/private/ssl_cert');

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
  };

// Create a JWT assertion
  var assertion = jwt.sign(body);

  it('should grant access token', function(done) {
    var form = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertion
    };

    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(form)
      .expect(200, /"access_token":/i, done);
  });

  it('should grant access token from authorization code', function(done) {
    var form = {
      grant_type: 'authorization_code',
      code: 'abc123',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: assertion
    };
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(form)
      .expect(200, /"access_token":/i, done);
  });
});

