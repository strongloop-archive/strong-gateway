/**
 * Module dependencies.
 */
var express = require('express'), 
  passport = require('passport'), 
  util = require('util'), 
  http = require('http'), 
  https = require('https'), 
  path = require('path'),
  mongoose = require('mongoose'), 
  fs = require('fs'), 
  config = require('./config/config.js'), 
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

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() {
  console.log('connection opened');
});

// bootstrap mongoose connection
var mongo = {};
// if running in appfog
if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
  mongo = env['mongodb-1.8'][0]['credentials'];
} else {
  mongo = config.creds.mongo;
}

var generate_mongo_url = function(obj) {
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'node-api-platform_development');
  if (obj.username && obj.password) {
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  } else {
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}

var mongourl = generate_mongo_url(mongo);

if(mongoose.connection.readyState  == 0) {
  mongoose.connect(mongourl);
}

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', config.cors.allowedDomains);
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');

    //deal with OPTIONS method
    if (req.method == 'OPTIONS') {
      res.send(200);
    } else {
      next();
    }
};

// Express configuration
  
var app = express();

app.set('port', process.env.VMC_APP_PORT || config.http.port || 3002);
app.set('host', process.env.VCAP_APP_HOST || config.http.host || 'localhost');

app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(allowCrossDomain);

app.use('/oauth', express.bodyParser());
app.use('/dialog', express.bodyParser());
app.use('/login', express.bodyParser());

app.use(express.session({ secret: 'keyboard cat' }));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

app.use(express.static(path.join(__dirname, 'public')));

if(stats.instrument) {
    stats.instrument.count_success(auth, "authenticate", "node-api-platform.auth.counter");
}

var protectedResources = JSON.parse(fs.readFileSync('./resources.json'));

for (var i = 0; i < protectedResources.length; i++) { 
    var protectedResource = protectedResources[i];
    console.log("Registering protected resource: " + JSON.stringify(protectedResource));

// Configure the oAuth access token authentication hook
app.use(protectedResource.basePath, function(req, res, next) {
    console.log("Checking oAuth access token: " + req.path);
    var scopes = [];
    for(var j=0; j<protectedResource.resources.length; j++) {
       var resource = protectedResource.resources[j];
       if(req.path.indexOf(resource.path) == 0 ) {
           console.log("Protected resource: " + JSON.stringify(resource));
           scopes = resource.scopes;
       }
    }
    if(scopes.length != 0) {
        var options = {session : false, scope: scopes};
        auth.authenticate(options, req, res, next); 
    } else {
        next();
    }
}); 
}

// IMPORTANT: The router has to come after the oAuth2 access token check
app.use(app.router);

// app.get('/', site.index);
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

app.get('/oauth/dialog/decision', function(req, res) {
  res.render('dialog', { transactionID: req.oauth2.transactionID, 
                         user: req.user, 
                         client: req.oauth2.client });
});

// Configure the proxy before the bodyParser
// See https://github.com/nodejitsu/node-http-proxy/issues/180
app.use('/proxy', proxy.route);
app.use('/protected/proxy', proxy.route);

app.get('/protected/html/secret.html', function(req, res, next) {
  res.render('secret');
});

http.createServer(app).listen(app.get('port'), app.get('host'), function(){
  console.log("Express server on " + app.get('host') + " listening on port " + app.get('port'));
});

/*
http.createServer(app).listen(9080);
console.log("http://localhost:9080");
https.createServer(options, app).listen(9443);
console.log("https://localhost:9443");
*/
