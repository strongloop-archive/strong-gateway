/* jshint camelcase: false, unused: vars */
var chai = require('chai');
chai.should();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var app = require('../server/server');
var request = require('supertest')('https://localhost:3001');

var TOKEN_ENDPOINT = '/oauth/token';
var CLIENT_ID = '123';
var CLIENT_ID_5 = '600';
var CLIENT_SECRET = 'secret';

describe('Authorize', function() {
  before(require('./start-server'));

  before(function(done) {
    var auth = app.oauth2.authenticate({session: false, scope: 'demo basic'});
    app.use(app.loopback.bodyParser.urlencoded({extended: false}));
    app.use(app.loopback.bodyParser.json({strict: false}));
    app.use(['/test'], auth, function(req, res, next) {
      if (req.accessToken) {
        req.accessToken.user(function(err, user) {
          if (err) {
            return next(err);
          }
          res.json(user);
        });
      }
    });
    var auth2 = app.oauth2.authenticate({session: false, scope: 'email'});
    app.use(['/email'], auth2, function(req, res, next) {
      if (req.accessToken) {
        req.accessToken.user(function(err, user) {
          if (err) {
            return next(err);
          }
          res.json(user);
        });
      }
    });
    done();
  });

  after(function(done) {
    app.close(done);
  });

  var token;
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
        token = res.body.access_token;
        done();
      });
  });

  it('should detect no access token', function(done) {
    request
      .get('/test')
      .expect(401, done);
  });

  it('should allow valid token as query param', function(done) {
    request
      .get('/test?access_token=' + token)
      .expect(200, /"username":"bob"/, done);
  });

  it('should allow valid token in body', function(done) {
    request
      .post('/test')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: token })
      .expect(200, /"username":"bob"/, done);
  });

  it('should detect malformed header', function(done) {
    request
      .get('/test')
      .set('Authorization', 'Invalid')
      .expect(400, done);
  });

  it('should allow valid token in header', function(done) {
    request
      .get('/test')
      .set('Authorization', 'Bearer ' + token)
      .expect(200, /"username":"bob"/, done);
  });

  it('should allow exactly one method (get: query + auth)', function(done) {
    request
      .get('/test?access_token=' + token)
      .set('Authorization', 'Bearer Invalid')
      .expect(400, done);
  });

  it('should allow exactly one method (post: query + body)', function(done) {
    request
      .post('/test?access_token=' + token)
      .send({
        access_token: token
      })
      .expect(400, done);
  });

  it('should allow exactly one method (post: query + empty body)',
    function(done) {
      request
        .post('/test?access_token=' + token)
        .send({
          access_token: token
        })
        .expect(400, done);
    });

  it('should detect insufficient_scope', function(done) {
    request
      .get('/email?access_token=' + token)
      .expect(403, /insufficient_scope/i, done);
  });

  var loopback = require('loopback');
  var model = loopback.getModel('OAuthAccessToken');

  it('should revoke access token', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token: token,
        token_type_hint: 'access_token'
      })
      .expect(200, function(err) {
        model.find({where: {id: token}},
          function(err, tokens) {
            if (err) return done(err);
            tokens.length.should.be.eql(0);
            done();
          });
      });
  });

  it('should report missing token for revoke', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token_type_hint: 'access_token'
      })
      .expect(400, /invalid_request/, done);
  });

  it('should ignore invalid token for revoke', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token: 'invalid_token',
        token_type_hint: 'access_token'
      })
      .expect(200, done);
  });

  it('should report invalid token type for revoke', function(done) {
    request
      .post('/oauth/revoke')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .auth(CLIENT_ID, CLIENT_SECRET)
      .send({
        token: token,
        token_type_hint: 'invalid_token_type'
      })
      .expect(400, /unsupported_token_type/, done);
  });

  it('should detect expired token', function(done) {
    model.destroyById('abc1', function(err) {
      // Mock up an access token to be expired in 1 ms
      model.create({
        id: 'abc1',
        scopes: ['demo'],
        userId: 1,
        appId: '123',
        issuedAt: new Date(),
        expiredAt: new Date(Date.now() + 1)
      }, function(err, token) {
        if (err) {
          return done(err);
        }
        setTimeout(function() {
          request
            .get('/test?access_token=' + token)
            .expect(401, done);
        }, 5);
      });
    });
  });

  describe('mac token', function() {
    var token;

    before(function(done) {
      request
        .post(TOKEN_ENDPOINT)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          grant_type: 'password',
          client_id: CLIENT_ID_5,
          client_secret: CLIENT_SECRET,
          username: 'bob',
          password: 'secret',
          scope: 'basic'
        })
        .expect(200, /"access_token":/i, function(err, res) {
          if (err) {
            return done(err);
          }
          token = res.body;
          done();
        });
    });

    it('should accept signed token', function(done) {
      request
        .get('/test')
        .set('authorization', setupMacAuth(token))
        .expect(200, /"username":"bob"/, done);
    });

    it('should report expired timestamp', function(done) {
      request
        .get('/test')
        .set('authorization', setupMacAuth(token, 1))
        .expect(401, done);
    });

    it('should report invalid mac', function(done) {
      request
        .get('/test')
        .set('authorization', setupMacAuth(token, Date.now(), '123'))
        .expect(401, done);
    });

    var crypto = require('crypto');
    var algorithms = {
      'hmac-sha-1': 'sha1',
      'hmac-sha-256': 'sha256'
    };

    function setupMacAuth(token, ts, mac) {
      var params = {
        access_token: token.access_token,
        kid: token.kid,
        ts: ts || Date.now(),
        h: 'host'
      };

      if (!mac) {
        var text =
          ['GET /test HTTP/1.1', params.ts, 'localhost:3001'].join('\n');
        mac = crypto.createHmac(algorithms[token.mac_algorithm], token.mac_key)
          .update(text).digest('base64');
      }

      params.mac = mac;
      var fields = [];
      for (var p in params) {
        fields.push(p + '="' + params[p] + '"');
      }
      return 'MAC ' + fields.join(',');
    }
  });

});
