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

  var oauth2 = require('loopback-component-oauth2')(
    app, {
      dataSource: app.dataSources.db, // Data source for oAuth2 metadata
      loginPage: '/login', // The login page url
      loginPath: '/login' // The login processing url
    });

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

// Set up login/logout forms
  app.get('/login', site.loginForm);

  app.get('/logout', site.logout);
  app.get('/account', site.account);
  app.get('/callback', site.callbackPage);

  app.oauth2 = oauth2; // For testing
  var auth = oauth2.authenticate({session: false, scope: 'demo'});
  app.use(['/protected', '/api', '/me'], auth);

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
});



