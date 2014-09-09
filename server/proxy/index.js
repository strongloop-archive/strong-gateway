var debug = require('debug')('loopback:gateway:proxy');
var httpProxy = require('http-proxy');

module.exports = function(options) {
  var proxy = httpProxy.createProxyServer(options);

  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    debug(proxyReq);
  });

  proxy.on('proxyRes', function(proxyRes, req, res) {
    debug(proxyRes);
  });

  proxy.on('error', function(err, req, res) {
    var proxyErr = new Error('Proxy error');
    proxyErr.url = req.url;
    proxyErr.target = req.target;
    proxyErr.cause = err;
    res.status(500).send(proxyErr);
  });

  options = options || {};
  var router = options.router;

  var handler = function(req, res, next) {
    var target = options.target || 'http://localhost:3002/';
    if (typeof router === 'function') {
      target = router(req);
    }
    req.target = target;
    proxy.web(req, res, {target: target});
  };

  handler.proxy = proxy;
  return handler;
};