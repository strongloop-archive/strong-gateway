var metrics = require('metrics');

module.exports = function(options) {
  options = options || {};

  // TODO: [rfeng] options.limits can be a function that retrieve limits based on
  // the key and interval
  var limits = options.limits || {};
  var m1Max = limits.m1; // 1 minute
  var m5Max = m1Max ? null : limits.m5; // 5 minute if 1 minute limit is not set
  var m15Max = (m1Max || m5Max) ? null : limits.m15; // 15 minutes if neither 1 minute nor 5 minute is set

  var timers = {};
  var report = new metrics.Report();

  return function(req, res, next) {
    // Handle settings via /rate-limiting (DEMO only as it is not protected)
    if (req.path === (options.path || '/rate-limiting')) {
      if (typeof req.query.limits === 'string') {
        try {
          limits = JSON.parse(req.query.limits);
        } catch (err) {
          return res.status(400).json({error: err});
        }
        if (typeof limits === 'object') {
          m1Max = limits.m1; // 1 minute
          m5Max = m1Max ? null : limits.m5; // 5 minute if 1 minute limit is not set
          m15Max = (m1Max || m5Max) ? null : limits.m15; // 15 minutes if neither 1 minute nor 5 minute is set
        } else if (typeof limits === 'string') {
          m1Max = limits;
          m5Max = undefined;
          m15Max = undefined;
          limits = {m1: m1Max, m5: m5Max, m15: m15Max};
        }
      }
      return res.json({limits: limits, stats: report.summary()});
    }

    var timer;
    var key = (options.getKey || getKey)(req);
    if (key) {
      timer = timers[key];
      if (!timer) {
        timer = new metrics.Timer();
        report.addMetric(key, timer);
        timers[key] = timer;
      } else {
        var meter = timer.meter;
        var count = Math.floor(meter.oneMinuteRate()) * 60;
        var remaining = 0;
        if (m1Max) {
          remaining = m1Max - count;
          remaining = remaining > 0 ? remaining : 0;
          res.setHeader('X-RateLimit-Limit', m1Max);
          res.setHeader('X-RateLimit-Remaining', remaining);
          res.setHeader('X-RateLimit-Reset', Date.now() + 60000);
          if (remaining === 0) {
            res.status(429).json({error: '1 minute limit exceeded'});
            return;
          }
        }
        count = Math.floor(meter.fiveMinuteRate()) * 60 * 5;
        if (m5Max) {
          remaining = m5Max - count;
          remaining = remaining > 0 ? remaining : 0;
          res.setHeader('X-RateLimit-Limit', m5Max);
          res.setHeader('X-RateLimit-Remaining', m5Max - count || 0);
          res.setHeader('X-RateLimit-Reset', Date.now() + 60000 * 5);
          if (remaining === 0) {
            res.status(429).json({error: '5 minute limit exceeded'});
            return;
          }
        }
        count = Math.floor(meter.fifteenMinuteRate()) * 60 * 15;
        if (m15Max) {
          remaining = m15Max - count;
          remaining = remaining > 0 ? remaining : 0;
          res.setHeader('X-RateLimit-Limit', m15Max);
          res.setHeader('X-RateLimit-Remaining', m15Max - count);
          res.setHeader('X-RateLimit-Reset', Date.now() + 60000 * 15);
          if (remaining === 0) {
            res.status(429).json({error: '15 minute limit exceeded'});
            return;
          }
        }
      }
      var start = process.hrtime();
      res.once('finish', function() {
        var diff = process.hrtime(start);
        var ms = diff[0] * 1e3 + diff[1] * 1e-6;
        timer.update(ms);
      });
    }
    next();
  };
}

/**
 * Build the key for rate limiting from the request
 * @param {Request} req The request object
 * @returns {string} The rate limiting key
 */
function getKey(req) {
  var clientId = '';
  var clientApp = req.authInfo && req.authInfo.app;
  if(clientApp) {
    clientId = clientApp.id;
  }
  return clientId;
}
