// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

require('strongloop-license')('gateway:gateway=StrongLoop API Gateway', 'EXIT');
var boot = require('loopback-boot');
var http = require('http');
var https = require('https');
var loopback = require('loopback');
var path = require('path');
var site = require('./site');
var sslCert = require('./private/ssl_cert');

var app = module.exports = loopback();
var httpsOptions = {
  key: sslCert.privateKey,
  cert: sslCert.certificate
};
app.httpsOptions = httpsOptions;

boot(app, __dirname, function(err) {
  if (err) throw err;

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Set up login/logout forms
  app.get('/login', site.loginForm);

  app.oauth2 = app._oauth2Handlers; // For testing

  var isMain = require.main === module;
  app.start = function() {
    var port = app.get('port');
    var host = app.get('host');
    var httpServer = http.createServer(app).listen(port, host, function() {
      if (isMain)
        printServerListeningMsg('http', host, port);

      var httpsPort = app.get('https-port');
      var httpsServer = https.createServer(httpsOptions, app).listen(httpsPort,
          host, function() {
        if (isMain)
          printServerListeningMsg('https', host, httpsPort);

        app.emit('started');

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

  if (isMain)
    app.start();

  app.loaded = true;
  app.emit('loaded');
});

function printServerListeningMsg(protocol, host, port) {
  var url = protocol + '://' + host + ':' + port;
  console.log('Web server listening at', url);
}
