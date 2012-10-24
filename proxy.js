var http = require('http'),
    httpProxy = require('http-proxy');

var options = {
  router: './routes.json'
};

var proxy = new httpProxy.RoutingProxy(options);

exports.route = function(req, res, next) {
    console.log("Proxying request: " + req.path);
    proxy.proxyRequest(req, res);
}
