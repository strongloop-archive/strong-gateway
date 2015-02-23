var debug = require('debug')('loopback:policy:rate-limiting');
var limiter = require('limiter');

module.exports = RateLimiter;

function RateLimiter(options) {
  if (!(this instanceof RateLimiter)) {
    return new RateLimiter(options);
  }
  options = options || {};

  this.limit = options.limit || 1000;
  this.interval = options.interval || 1000; // ms
  this.limiters = {};
  this.options = options;
}

RateLimiter.prototype.getLimiter = function(key, limit) {
  var inst;
  debug('Key: %s', key);
  if (key) {
    inst = this.limiters[key];
    if (!inst) {
      debug('Creating rate limiter: %d %d', limit, this.interval);
      inst = new limiter.RateLimiter(limit, this.interval);
      this.limiters[key] = inst;
    }
  }
  return inst;
};

RateLimiter.prototype.enforce = function(key, options, cb) {
  if (cb === undefined && typeof options === 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  var weight = options.weight || 1;
  var limit = options.limit || this.limit;
  var inst = this.getLimiter(key, limit);
  if (inst) {
    var ok = inst.tryRemoveTokens(weight);
    debug('Bucket: ', inst.tokenBucket);
    var remaining = Math.floor(inst.getTokensRemaining());
    var reset =
      Math.max(this.interval - (Date.now() - inst.curIntervalStart), 0);

    debug('Limit: %d Remaining: %d Reset: %d', limit, remaining, reset);

    var result = {
      limit: limit,
      remaining: remaining,
      reset: reset,
      isAllowed: ok
    };

    process.nextTick(function() {
      if (cb) {
        cb(null, result);
      }
    });
  }
};
