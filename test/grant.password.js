/* jshint camelcase: false */
var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_SECRET = 'secret';

describe('Granting with password grant type', function () {

  before(require('./start-server'));

  after(function(done) {
    app.close(done);
  });

  it('should detect missing parameters', function (done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
      .expect(400, /"Missing required parameter: username"/i, done);

  });

  it('should detect invalid user', function (done) {
    request
      .post(TOKEN_ENDPOINT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username: 'john',
        password: 'nightworld'
      })
      .expect(403, /invalid_grant/i, done);

  });
});
