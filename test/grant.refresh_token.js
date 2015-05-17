/* jshint camelcase: false */

var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var REFRESH_TOKEN = 'refresh_token';
var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_SECRET = 'secret';

describe('Granting with refresh_token grant type', function() {

  before(require('./start-server'));

  after(function(done) {
    app.close(done);
  });

  var refreshToken;
  before(function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        username: 'bob',
        password: 'secret',
        scope: 'demo'
      })
      .auth(CLIENT_ID, CLIENT_SECRET)
      .expect(200, /"access_token":/i, function(err, res) {
        if (err) {
          return done(err);
        }
        refreshToken = res.body.refresh_token;
        done();
      });
  });

  it('should detect missing refresh_token parameter', function(done) {
    request
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        grant_type: REFRESH_TOKEN
      })
      .expect(400, /invalid_request/i, done);

  });

  it('should detect invalid refresh_token', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: 'refresh_token_1'
      })
      .expect(403, /invalid_grant/i, done);

  });

  it('should detect wrong client id', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: REFRESH_TOKEN,
        client_id: 'wrong',
        client_secret: CLIENT_SECRET,
        refresh_token: 'refresh_token_1'
      })
      .expect(401, done);

  });

  it('should allow valid request', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken
      })
      .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);
  });

  var loopback = require('loopback');
  var model = loopback.getModel('OAuthAccessToken');

  it('should revoke refresh token', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token: refreshToken,
        token_type_hint: 'refresh_token'
      })
      .expect(200, function(err) {
        if (err) return done(err);
        model.find({where: {refreshToken: refreshToken}},
          function(err, tokens) {
            if (err) return done(err);
            tokens.length.should.be.eql(0);
            done();
          });
      });
  });

  it('should report missing token', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token_type_hint: 'refresh_token'
      })
      .expect(400, /invalid_request/, done);
  });

  it('should ignore invalid token', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token: 'invalid_token',
        token_type_hint: 'refresh_token'
      })
      .expect(200, done);
  });

  it('should report invalid token type', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token: refreshToken,
        token_type_hint: 'invalid_token_type'
      })
      .expect(400, /unsupported_token_type/, done);
  });
});
