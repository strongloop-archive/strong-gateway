/* jshint camelcase: false */
var chai = require('chai');
chai.should();

var loopback = require('loopback');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_SECRET = 'secret';

describe('Granting with authorization_code grant type', function () {

  before(require('./start-server'));

  // Hacky way to create an authorization code
  before(function(done) {
    var model = loopback.getModel('OAuthAuthorizationCode');
    model.destroyAll(function(err) {
      if (err) return done(err);
      model.create({
        id: 'abc2',
        scopes: ['demo'],
        userId: 1,
        appId: '123',
        redirectURI: 'https://localhost:3001',
        issuedAt: new Date(),
        expiredAt: new Date(Date.now() + 5000)
      }, function(err, code) {
        done(err, code);
      });
    });
  });

  after(function(done) {
    app.close(done);
  });

  it('should detect missing parameters', function (done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
      .expect(400, /invalid_request/i, done);
  });

  it('should report invalid authorization_code', function (done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: 'xyz'
      })
      .expect(403, /invalid_grant/i, done);
  });

  it('should detect invalid client_id', function (done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'authorization_code',
        client_id: '999',
        client_secret: CLIENT_SECRET,
        code: 'abc2'
      })
      .expect(401, done);
  });

  it('should allow valid request', function (done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: 'abc2',
        redirect_uri: 'https://localhost:3001'
      })
      .expect(200, /"access_token":"(.*)"/i, done);
  });

  it('should detect expired code', function (done) {
    setTimeout(function() {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: 'abc2'
        })
        .expect(403, /invalid_grant/i, done);
    }, 5500);
  });

});
