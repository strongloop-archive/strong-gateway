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

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname);


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

signupTestUserAndApp();

app.start = function() {
  var port = app.get('port');
  var httpsPort = app.get('https-port');

  http.createServer(app).listen(port, function() {
    console.log('Web server listening at: %s', 'http://localhost:3000/');
    https.createServer(httpsOptions, app).listen(httpsPort, function() {
      app.emit('started');
      console.log('Web server listening at: %s', app.get('url'));
    });
  });

};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}

function signupTestUserAndApp() {
// Create a dummy user and client app
  app.models.User.create({username: 'bob',
    password: 'secret',
    email: 'foo@bar.com'}, function(err, user) {

    if (!err) {
      console.log('User registered: username=%s password=%s',
        user.username, 'secret');
    }

    // Hack to set the app id to a fixed value so that we don't have to change
    // the client settings
    app.models.Application.beforeSave = function(next) {
      this.id = 123;
      this.restApiKey = 'secret';
      next();
    };
    app.models.Application.register(
      user.id,
      'demo-app',
      {
        publicKey: sslCert.certificate
      },
      function(err, demo) {
        if (err) {
          console.error(err);
        } else {
          console.log('Client application registered: id=%s key=%s',
            demo.id, demo.restApiKey);
        }
      }
    );

  });
}
