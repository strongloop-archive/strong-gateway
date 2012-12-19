var http = require('http'),
    httpProxy = require('http-proxy');

var options = {
  router: './routes.json',
  changeOrigin: true
};

var proxy = new httpProxy.RoutingProxy(options);

exports.route = function(req, res, next) {
    console.log("Proxying request: " + req.host + " " + req.path);
    proxy.proxyRequest(req, res);
}
