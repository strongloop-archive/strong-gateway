var debug = require('debug')('strong-gateway:acl');

module.exports = function(options) {
  options = options || {};
  debug('Options: %j', options);

  return function checkRouteAcls(req, res, next) {
    debug('Headers: %j', req.headers);
    debug('Access Token: %j', req.accessToken);
    debug('Request URL: %s', req.url);

    // For declarative ACLs, they will be available from the options object

    // Your custom ACL logic here

    next();
  };
};
