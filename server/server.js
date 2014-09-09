var loopback = require('loopback');
var boot = require('loopback-boot');

var https = require('https')
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

// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// -- Add your pre-processing middleware here --

// boot scripts mount components like REST API
boot(app, __dirname);

var oauth2 = require('loopback-oauth2').oAuth2Provider(app, {dataSource: app.dataSources.db});

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

// app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/oauth/authorize', oauth2.authorization);
app.post('/oauth/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);

app.get('/userinfo', user.info);

app.get('/callback', site.callbackPage);

app.set('views', path.join(__dirname, 'views'));
app.use(loopback.static(path.join(__dirname, '../client/public')));

app.use('/admin', loopback.static(path.join(__dirname, '../client/admin')));

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
    },
    function(err, demo) {
      if (err) {
        console.error(err);
      } else {
        console.log(demo.id, demo.restApiKey);
      }
    }
  );

});

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());

app.start = function() {
  https.createServer(httpsOptions, app).listen(app.get('port'), function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
