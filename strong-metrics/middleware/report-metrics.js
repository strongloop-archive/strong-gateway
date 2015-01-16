var onFinished = require('on-finished');

module.exports = function(options) {
  var MetricEvent;
  var _lastSaveError;

  return function reportMetricEvent(req, res, next) {
    if (!MetricEvent) MetricEvent = findMetricEventModel(req.app);
    onFinished(res, logEvent);
    next();

    function logEvent() {
      var clientApp = req.authInfo && req.authInfo.app;
      var user = req.authInfo && req.authInfo.user || req.user;

      var endpoint = req.originalUrl || req.url;
      endpoint = endpoint.replace(/\?.*$/, ''); // drop the query

      var event = new MetricEvent({
        timestamp: new Date(),
        endpoint: endpoint,
        status: res.statusCode,
        appId: clientApp ? clientApp.id : null,
        appName: clientApp ? clientApp.name : null,
        userId: user ? user.id : null,
        userEmail: user ? user.email : null
      });

      event.save(function(err) {
        if (!err || err.message === _lastSaveError.message) return;
        console.warn('Cannot save metric event.', err);
        _lastSaveError = err;
      });
    }
  };

  function findMetricEventModel(app) {
    // TODO(bajtos) report error when MetricEvent is not a configured model
    return app.models.MetricEvent;
  }
};
