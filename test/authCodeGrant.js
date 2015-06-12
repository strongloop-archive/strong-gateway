/* jshint camelcase: false , unused: vars */
var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var REDIRECT_URI = 'https://localhost:3001';
var INVALID_REDIRECT_URI = 'https://wrong.com';
var AUTHORIZATION_ENDPOINT = '/oauth/authorize';
var CLIENT_ID = '123';
var CLIENT_ID_2 = '456';
var CLIENT_ID_3 = '789';

var CODE = 'code';
var TOKEN = 'token';

describe('AuthCodeGrant', function() {

  before(require('./start-server'));

  after(function(done) {
    app.close(done);
  });

  it('should detect no response type', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({response_type: undefined})
      .expect(400, done);
  });

  it('should detect invalid response type', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({response_type: 'token'})
      .expect(400, done);
  });

  it('should detect no client_id', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({response_type: CODE, client_id: undefined})
      .expect(400, done);
  });

  it('should detect no redirect_uri', function(done) {
    // Client app 2 doesn't have predefined redirect uris. The redirect_uri
    // is required from the request
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({
        response_type: CODE,
        client_id: CLIENT_ID_2,
        redirect_uri: undefined
      })
      .expect(400, done);
  });

  it('should detect invalid client', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .set('Content-Type', 'application/json')
      .query({
        response_type: CODE,
        client_id: 'xyz',
        redirect_uri: REDIRECT_URI
      })
      .expect('WWW-Authenticate',
      'Basic realm="oAuth 2.0 client authentication"')
      .expect(401, done);
  });

  it('should detect unauthorized response type', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({
        response_type: TOKEN,
        client_id: CLIENT_ID_3,
        redirect_uri: REDIRECT_URI
      })
      .expect(403, /Unauthorized response type/i, done);
  });

  it('should detect unauthorized scope', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({
        response_type: CODE,
        client_id: CLIENT_ID_3,
        redirect_uri: REDIRECT_URI,
        scope: 'demo'
      })
      .expect(403, /Unauthorized scope/i, done);
  });

  it('should detect mismatching redirect_uri with a string', function(done) {
    request
      .get(AUTHORIZATION_ENDPOINT)
      .query({
        response_type: CODE,
        client_id: CLIENT_ID,
        redirect_uri: INVALID_REDIRECT_URI
      })
      .expect(403, done);
  });

  it('should accept a valid redirect_uri with a string', function(done) {
    requestCodeOrToken(CODE, REDIRECT_URI, 'allow', done);
  });

  function requestCodeOrToken(responseType, redirectURI, action, done) {
    app.loopback.getModel('OAuthPermission').destroyAll(function(err) {
      if (err) return done(err);
      var cookie;
      // Send the request to the authorization endpoint
      request
        .get(AUTHORIZATION_ENDPOINT)
        .query({
          response_type: responseType,
          client_id: CLIENT_ID,
          redirect_uri: redirectURI,
          state: 'some_state'
        })
        .expect(302, function(err, res) {
          if (err) {
            return done(err);
          }
          // Redirect to the login page
          cookie = res.headers['set-cookie'];
          var location = res.header.location;
          // Fetch the login form
          request.get(location)
            .set('cookie', cookie)
            .expect(200, function(err, res) {
              if (err) {
                return done(err);
              }
              // Submit the login form
              request.post(location)
                .set('cookie', cookie)
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  username: 'bob',
                  password: 'secret'
                })
                .expect(302, function(err, res) {
                  if (err) {
                    return done(err);
                  }
                  // Redirect to the decision dialog
                  var location = res.header.location;
                  // Fetch the decision page
                  request.get(location)
                    .set('cookie', cookie)
                    .expect(200, function(err, res) {
                      if (err) {
                        return done(err);
                      }
                      // Parse the page to extract the transaction id
                      var pattern = '<input name="transaction_id"' +
                        ' type="hidden" value="';
                      var index = res.text.indexOf(pattern);
                      var txid = res.text.substring(index + pattern.length,
                        index + pattern.length + 8);
                      // Submit the decision form
                      var form = {
                        transaction_id: txid
                      };
                      if (action === 'deny') {
                        form.cancel = 'Deny';
                      }
                      request.post('/oauth/authorize/decision')
                        .set('cookie', cookie)
                        .set('Content-Type',
                        'application/x-www-form-urlencoded')
                        .send(form)
                        .expect(302, function(err, res) {
                          if (err) {
                            return done(err);
                          }
                          // Redirect to the url with authorization code
                          var location = res.header.location;
                          var str;
                          if (responseType === 'code') {
                            str = REDIRECT_URI +
                              '\\/\\' + '?code=[^&]+&state=some_state';
                            if (action === 'deny') {
                              str =
                                REDIRECT_URI +
                                '\\/\\' +
                                '?error=access_denied&state=some_state';
                            }
                          }
                          if (responseType === 'token') {
                            if (action === 'deny') {
                              str =
                                REDIRECT_URI +
                                '\\/\\' +
                                '#error=access_denied&state=some_state';
                            } else {
                              str =
                                REDIRECT_URI +
                                '\\/\\' +
                                '#access_token=[^&]+&expires_in=1209600' +
                                '&token_type=Bearer&state=some_state';
                            }
                          }
                          var regex = new RegExp(str);
                          location.should.match(regex);
                          done();
                        });
                    });
                });
            });
        });
    });
  }

  it('should accept valid request and return code and state using GET',
    function(done) {
      requestCodeOrToken(CODE, REDIRECT_URI, 'allow', done);
    });

  it('should accept valid request and return token and state using GET',
    function(done) {
      requestCodeOrToken(TOKEN, REDIRECT_URI, 'allow', done);
    });

  it('should deny code request if user rejects',
    function(done) {
      requestCodeOrToken(CODE, REDIRECT_URI, 'deny', done);
    });

  it('should deny token request if user rejects',
    function(done) {
      requestCodeOrToken(TOKEN, REDIRECT_URI, 'deny', done);
    });
});
