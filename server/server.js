require('strongloop-license')('gateway');
var loopback = require('loopback');
var boot = require('loopback-boot');

var http = require('http');
var https = require('https');
var path = require('path');

var site = require('./site');
var sslCert = require('./private/ssl_cert');

var httpsOptions = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};

var app = module.exports = loopback();

app.httpsOptions = httpsOptions;

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname, function(err) {
  if(err) {
    throw err;
  }

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

// Set up login/logout forms
  app.get('/login', site.loginForm);

  app.get('/logout', site.logout);
  app.get('/account', site.account);
  app.get('/callback', site.callbackPage);

  app.oauth2 = app._oauth2Handlers; // For testing

  /* jshint unused: vars */
  app.get('/me', function(req, res, next) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`.  It is typically used to indicate scope of the token,
    // and used in access control checks.  For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json({ 'user_id': req.user.id, name: req.user.username,
      accessToken: req.authInfo.accessToken });
  });

  var isMain = require.main === module;
  app.start = function() {
    var host = app.get('host');
    var port = app.get('port');
    var httpsPort = app.get('https-port');

    var httpServer = http.createServer(app).listen(port, host, function() {
      if (isMain) {
        console.log('Web server listening at: %s', 'http://localhost:3000/');
      }
      var httpsServer = https.createServer(httpsOptions, app).listen(
        httpsPort, host,
        function() {
          app.emit('started');
          if (isMain) {
            console.log('Web server listening at: %s', app.get('url'));
          }
          app.close = function(cb) {
            app.removeAllListeners('started');
            app.removeAllListeners('loaded');
            httpServer.close(function() {
              httpsServer.close(cb);
            });
          };
        });
    });
  };

// start the server if `$ node server.js`
  if (isMain) {
    app.start();
  }
  app.loaded = true;
  app.emit('loaded');
});



