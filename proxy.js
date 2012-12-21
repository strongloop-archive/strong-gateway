var http = require('http'),
    httpProxy = require('http-proxy');

var options = {
  router: './routes.json',
  changeOrigin: true
};

var proxy = new httpProxy.RoutingProxy(options);

/**
 * Dispatch to the target endpoint 
 */
exports.proxyRequest = function(req, res, next) {
    console.log("Proxying request: " + req.host + " " + req.path);
    proxy.proxyRequest(req, res, {buffer: req.proxyBuffer});
}

/**
 * Buffer the request so that the events and data will be captured before the 
 * reverse proxy is created 
 */
exports.bufferRequest = function(req, res, next) {
    req.proxyBuffer = httpProxy.buffer(req);
    next();
}
