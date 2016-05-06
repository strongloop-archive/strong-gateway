// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

// require('strongloop-license')('gateway');

var metricsLimiter = require('./metrics-limiter');
var tokenBucketLimiter = require('./token-bucket');

module.exports = function(options) {
  options = options || {};
  if (options.type === 'metrics') {
    return metricsLimiter(options);
  } else {
    return tokenBucketLimiter(options);
  }
};
