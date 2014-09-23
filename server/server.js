var loopback = require('loopback');
var boot = require('loopback-boot');

var http = require('http')
  , https = require('https')
  , passport = require('passport')
  , path = require('path')
  , site = require('./site')
  , user = require('./user')
  , sslCert = require('./private/ssl_cert');

var httpsOptions = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};

var app = module.exports = loopback();

// Redirect http requests to https
app.use(function(req, res, next) {
  if (!req.secure) {
    var parts = req.get('host').split(':');
    var host = parts[0] || '127.0.0.1';
    var port = Number(parts[1] || 80) + 1;
    return res.redirect('https://' + host + ':' + port + req.url);
  }
  next();
});

// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname);

var oauth2 = require('loopback-component-oauth2').oAuth2Provider(
  app, {dataSource: app.dataSources.db});

app.set('view engine', 'ejs');

app.use(loopback.cookieParser(app.get('cookieSecret')));
app.use(loopback.json());
app.use(loopback.urlencoded({extended: false}));

app.use(loopback.session({ saveUninitialized: true, resave: true, secret: 'keyboard cat' }));

// -- Mount static files here--
// All static middleware should be registered at the end, as all requests
// passing the static middleware are hitting the file system
// Example:
//   app.use(loopback.static(path.resolve(__dirname', '../client')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/protected', function(req, res, next) {
  passport.authenticate('bearer',
    {session: false, scope: 's1'})(req, res, next);
});

app.use('/api', function(req, res, next) {
  passport.authenticate('bearer',
    {session: false, scope: 's1'})(req, res, next);
});

// Set up the oAuth 2.0 protocol endpoints
app.get('/oauth/authorize', oauth2.authorization);
app.post('/oauth/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);

// Set up login/logout forms
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/userinfo', user.info);
app.get('/callback', site.callbackPage);

app.set('views', path.join(__dirname, 'views'));
app.use(loopback.static(path.join(__dirname, '../client/public')));

app.use('/admin', loopback.static(path.join(__dirname, '../client/admin')));

signupTestUserAndApp();

var rateLimiting = require('./rate-limiting');
app.use(rateLimiting({limit: 100, interval: 60000}));

var proxy = require('./proxy');
var proxyOptions = require('./proxy/config.json');
app.use(proxy(proxyOptions));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());

app.start = function() {
  var port = app.get('port');

  http.createServer(app).listen(port, function() {
    console.log('Web server listening at: %s', 'http://localhost:3000/');
    https.createServer(httpsOptions, app).listen(port + 1, function() {
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
          console.log('Client application %s %s', demo.id, demo.restApiKey);
        }
      }
    );

  });
}
