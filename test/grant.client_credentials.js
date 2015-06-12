/* jshint camelcase: false */
var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var loopback = require('loopback');
var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_ID_3 = '789';
var CLIENT_ID_4 = '500';
var CLIENT_ID_5 = '600';
var CLIENT_SECRET = 'secret';

describe('Granting with client_credentials grant type', function() {

  before(require('./start-server'));

  // Create a permission
  before(function(done) {
    var permissionModel = loopback.getModel('OAuthPermission');
    permissionModel.destroyAll(function(err) {
      if (err) {
        return done(err);
      }
      permissionModel.create({
        appId: '123',
        scopes: ['demo'],
        userId: 1,
        issuedAt: new Date()
      }, done);
    });
  });

  after(function(done) {
    app.close(done);
  });

  function requestAccessToken(payload, done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(payload)
      .auth(CLIENT_ID, CLIENT_SECRET)
      .expect(200, /"access_token":/i, function(err, res) {
        if (err) {
          return done(err);
        }
        res.body.access_token.should.be.a('string');
        res.body.access_token.should.have.length(32);
        res.body.token_type.should.equal('Bearer');
        res.body.expires_in.should.equal(1209600);
        done();
      });
  }

  it('should generate access token', function(done) {
    requestAccessToken({
      grant_type: 'client_credentials',
      scope: 'demo'
    }, done);
  });

  it('should generate access token with subject', function(done) {
    requestAccessToken({
      grant_type: 'client_credentials',
      scope: 'demo',
      sub: 'bob'
    }, done);
  });

  it('should generate access token with username', function(done) {
    requestAccessToken({
      grant_type: 'client_credentials',
      scope: 'demo',
      username: 'bob'
    }, done);
  });

  it('should report error with invalid subject', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials',
        scope: 'demo',
        sub: 'invalid_user'
      })
      .auth(CLIENT_ID, CLIENT_SECRET)
      .expect(403, /Invalid subject/i, done);
  });

  it('should report error with if the grant type is not authorized',
    function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials',
        scope: 'basic',
        sub: 'bob'
      })
      .auth(CLIENT_ID_3, CLIENT_SECRET)
      .expect(403, /Unauthorized grant type/i, done);
  });

  it('should report error with if the scope is not authorized', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials',
        scope: 'demo abc',
        sub: 'bob'
      })
      .auth(CLIENT_ID, CLIENT_SECRET)
      .expect(403, /"Unauthorized scope: demo,abc"/i, done);
  });

  it('should detect invalid client', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials'
      })
      .auth(CLIENT_ID, 'wrong')
      .expect(401, done);

  });

  it('should generate jwt token',
    function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'client_credentials',
          scope: 'basic'
        })
        .auth(CLIENT_ID_4, CLIENT_SECRET)
        .expect(200, /"access_token":/i, function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.access_token.should.be.a('string');
          res.body.access_token.should.have.length(219);
          res.body.token_type.should.equal('Bearer');
          res.body.expires_in.should.equal(1209600);
          done();
        });
    });

  it('should generate mac token',
    function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'client_credentials',
          scope: 'basic'
        })
        .auth(CLIENT_ID_5, CLIENT_SECRET)
        .expect(200, /"access_token":/i, function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.access_token.should.be.a('string');
          res.body.access_token.should.have.length(277);
          res.body.token_type.should.equal('mac');
          res.body.should.have.property('kid');
          res.body.should.have.property('mac_key');
          res.body.should.have.property('mac_algorithm');
          res.body.expires_in.should.equal(1209600);
          done();
        });
    });
});
