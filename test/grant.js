/* jshint camelcase: false */
var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_SECRET = 'secret';

var validBody = {
  grant_type: 'password',
  client_id: '123',
  client_secret: 'secret',
  username: 'bob',
  password: 'secret'
};

describe('Grant', function() {

  before(require('./start-server'));

  after(function(done) {
    app.close(done);
  });

  describe('when parsing request', function() {
    it('should only allow post', function(done) {
      request
        .get(TOKEN_ENDPOINT)
        .expect(404, done);
    });

    it('should check grant_type exists', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .auth(CLIENT_ID, CLIENT_SECRET)
        .expect(400, /unsupported_grant_type/i, done);
    });

    it('should check client_id exists', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password' })
        .expect(401, done);
    });

    it('should check client_secret exists', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password', client_id: CLIENT_ID })
        .expect(401, done);
    });

    it('should extract credentials from body', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET })
        .expect(400, done);
    });

    it('should extract credentials from header (Basic)', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .send('grant_type=password&username=test&password=invalid')
        .auth(CLIENT_ID, CLIENT_SECRET)
        .expect(403, /invalid_grant/i, done);
    });

    it('should detect unsupported grant_type', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'xyz',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET })
        .expect(400, /unsupported_grant_type/i, done);
    });
  });

  describe('check client credentials against model', function() {
    it('should detect invalid client', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password',
          client_id: CLIENT_ID,
          client_secret: 'wrong' })
        .expect(401, done);
    });
  });

  describe('check grant type allowed for client (via model)', function() {
    // FIXME: [rfeng] We need to check client to determine if a given grant
    // type is allowed
    it.skip('should detect grant type not allowed', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET })
        .expect(400, /unauthorized_client/i, done);
    });
  });

  describe('generate access token', function() {
    it('should allow override via model', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200, /"access_token":/, done);
    });

    it('should reissue if model returns object', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200, /"access_token":/, done);
    });
  });

  describe('saving access token', function() {
    it('should pass valid params to model.saveAccessToken', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200, done);

    });

    it('should pass valid params to model.saveRefreshToken', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200, done);
    });
  });

  describe('issue access token', function() {
    it('should return an oauth compatible response', function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          res.body.should.have.keys(['access_token', 'refresh_token',
            'expires_in', 'token_type']);

          res.body.access_token.should.be.a('string');
          res.body.access_token.should.have.length(32);
          res.body.token_type.should.equal('Bearer');
          res.body.expires_in.should.equal(1209600);

          done();
        });
    });

    it('should return an oauth compatible response with refresh_token',
      function(done) {
        request
          .post(TOKEN_ENDPOINT)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send(validBody)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            res.body.should.have.keys(['access_token', 'refresh_token',
              'expires_in', 'token_type']);
            res.body.access_token.should.be.a('string');
            res.body.access_token.should.have.length(32);
            res.body.refresh_token.should.be.a('string');
            res.body.refresh_token.should.have.length(32);
            res.body.token_type.should.equal('Bearer');
            res.body.expires_in.should.equal(1209600);

            done();
          });
      });
  });
});
