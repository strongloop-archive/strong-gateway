// Read the policy config json
var policyConfig = require('./policy-config.json');
// Transpile it into middleware config json
var policyMiddleware = require('./policy-middleware')(policyConfig);

// Merge in the metrics
var initialBefore = policyMiddleware['initial:before'];
if (!initialBefore) {
  initialBefore = {};
  policyMiddleware['initial:before'] = initialBefore;
}
initialBefore['strong-express-metrics'] = {
  params: [
    function buildRecord(req/*, res*/) {
      var clientApp = req.authInfo && req.authInfo.app;
      var user = req.authInfo && req.authInfo.user || req.user;
      return {
        client: {
          id: clientApp ? clientApp.id : null,
          username: user ?
          user.username || user.login || user.email || user.id :
            null,
        }
      };
    }
  ]
};

module.exports = policyMiddleware;
