/**
 * Module dependencies.
 */
var express = require('express'), 
  passport = require('passport'), 
  util = require('util'), 
  http = require('http'), 
  https = require('https'), 
  site = require('./site'), 
  oauth2 = require('./oauth2'), 
  user = require('./user'), 
  proxy = require('./proxy'), 
  auth = require('./auth'), // Passport configuration
  stats = require('./stats'), // Statsd instrumentation 
  sslCert = require('./private/ssl_cert')


var options = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};

// Express configuration
  
var app = express();

app.set('view engine', 'ejs');
app.use(express.logger());


app.use(express.cookieParser());

app.use('/oauth', express.bodyParser());
app.use('/dialog', express.bodyParser());
app.use('/login', express.bodyParser());

app.use(express.session({ secret: 'keyboard cat' }));

/*
app.use(function(req, res, next) {
  console.log('-- session --');
  console.dir(req.session);
  //console.log(util.inspect(req.session, true, 3));
  console.log('-------------');
  next()
});
*/

app.use(passport.initialize());
app.use(passport.session());
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

stats.instrument.count_success(auth, "authenticate", "node-api-platform.auth.counter");

// Configure the oAuth access token authentication hook
app.use('/protected', function(req, res, next) {
    console.log("Checking oAuth access token: " + req.path);
    auth.authenticate('s1', req, res, next); 
}); 

// IMPORTANT: The router has to come after the oAuth2 access token check
app.use(app.router);

app.get('/', site.index);
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

// Configure the proxy before the bodyParser
// See https://github.com/nodejitsu/node-http-proxy/issues/180
app.use('/proxy', proxy.route);

app.get('/protected/secret.html', function(req, res, next) {
  res.render('secret');
});

http.createServer(app).listen(9080);
console.log("http://localhost:9080");
https.createServer(options, app).listen(9443);
console.log("https://localhost:9443");
