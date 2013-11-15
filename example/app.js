/**
 * Module dependencies.
 */
var loopback = require('loopback'),
  util = require('util'),
  http = require('http'),
  https = require('https'),
  path = require('path'),
  fs = require('fs'),
  passport = require('passport'),
  site = require('../lib/site'),
  oauth2Models = require('../lib/models/oauth2'),
  oauth2 = require('../lib/oauth2'),
  user = require('../lib/user'),
  auth = require('../lib/auth'), // Passport configuration
  sslCert = require('../private/ssl_cert');

var options = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};

var dataSource = loopback.createDataSource('db', {connector: loopback.Memory});
oauth2Models.attachTo(dataSource);

// Express configuration

var app = loopback();

app.set('port', process.env.PORT || 3002);
app.set('host', process.env.HOST || 'localhost');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// app.use(proxy.bufferRequest); // Buffer the request so that the proxy can capture the related events and data

app.use('/rest', loopback.rest());

// app.use(loopback.session({ secret: 'keyboard cat' }));

app.use(passport.initialize());
// app.use(passport.session());
app.use(loopback.errorHandler({ dumpExceptions: true, showStack: true }));

function ResourceServer(resource) {
  this.resource = resource;
  var self = this;
  this.check = function (req, res, next) {
    console.log("Checking oAuth access token: " + req.path);
    var scopes = [];
    var r = self.resource;
    for (var j = 0; j < r.resources.length; j++) {
      var resource = r.resources[j];
      console.log("Checking against " + resource.path);
      if (req.path.indexOf(resource.path) == 0) {
        console.log("Protected resource: " + JSON.stringify(resource));
        scopes = resource.scopes;
        break;
      }
    }
    if (scopes.length !== 0) {
      var options = {session: false, scope: scopes};
      auth.authenticate(options, req, res, next);
    } else {
      next();
    }
  };
}
var protectedResources = JSON.parse(fs.readFileSync('./resources.json'));

for (var i = 0; i < protectedResources.length; i++) {
  var protectedResource = protectedResources[i];
  console.log("Registering protected resource: " + JSON.stringify(protectedResource));

  // Configure the oAuth access token authentication hook
  app.use(protectedResource.basePath, new ResourceServer(protectedResource).check);
}

// IMPORTANT: The router has to come after the oAuth2 access token check
app.use(app.router);

app.use(loopback.static(path.join(__dirname, '../public')));

app.get('/*', site.index);
app.get('/', site.home);
app.get('/home', site.home);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);
app.get('/api/userinfo', user.info);

app.post('/oauth/token', oauth2.token);
app.get('/oauth/dialog/auth', oauth2.authorization);
app.post('/oauth/dialog/decision', oauth2.decision);
app.get('/oauth/dialog/callback', site.callbackPage);

// Keep the following mapping so that oautho2rize is happy where the path is hard-coded
app.get('/dialog/authorize', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);

app.get('/oauth/dialog/decision', function (req, res) {
  res.render('dialog', { transactionID: req.oauth2.transactionID,
    user: req.user,
    client: req.oauth2.client });
});

// Configure the proxy before the bodyParser
// See https://github.com/nodejitsu/node-http-proxy/issues/180
// app.use('/proxy', proxy.proxyRequest);
// app.use('/public-proxy', proxy.proxyRequest);
// app.use('/protected/proxy', proxy.proxyRequest);

app.get('/protected/html/secret.html', function (req, res, next) {
  res.render('secret');
});

http.createServer(app).listen(app.get('port'), app.get('host'), function () {
  console.log("Express server on " + app.get('host') + " listening on port " + app.get('port'));
});

/*
 http.createServer(app).listen(9080);
 console.log("http://localhost:9080");
 https.createServer(options, app).listen(9443);
 console.log("https://localhost:9443");
 */
