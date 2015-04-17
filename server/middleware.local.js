module.exports = {
  'initial:before': {
    'strong-express-metrics': {
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
    }
  }
};
