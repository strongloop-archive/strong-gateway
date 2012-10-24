/**
 * Module dependencies.
 */
var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , http = require('http')
  , https = require('https') 
  , site = require('./site')
  , oauth2 = require('./oauth2')
  , user = require('./user')
  , proxy = require('./proxy')
  , sslCert = require('./private/ssl_cert')


var options = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};

// Express configuration
  
var app = express();

app.set('view engine', 'ejs');
app.use(express.logger());

// Configure the proxy before the bodyParser
// See https://github.com/nodejitsu/node-http-proxy/issues/180
app.use('/proxy', proxy.route);

app.use(express.cookieParser());
app.use(express.bodyParser());
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
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// Passport configuration
require('./auth');

app.use('/protected', function(req, res, next) {
  passport.authenticate('bearer', 
                        {session: false, scope: 's1'})(req, res, next); }); 

app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/dialog/authorize', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);

app.get('/api/userinfo', user.info);

app.get('/callback', site.callbackPage);

// app.listen(3000);
http.createServer(app).listen(9080);
console.log("http://localhost:9080");
https.createServer(options, app).listen(9443);
console.log("https://localhost:9443");
