/* jshint camelcase: false */
var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_SECRET = 'secret';

describe('Granting with client_credentials grant type', function() {

  before(function(done) {
    app.once('started', done);
    app.start();
  });

  after(function(done) {
    app.close(done);
  });

  it('should generate access token', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials',
        scope: 'demo'
      })
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
  });

  it('should detect invalid user', function(done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials'
      })
      .auth(CLIENT_ID, 'wrong')
      .expect(401, done);

  });
});