'use strict';

// require('strongloop-license')('gateway');
var _ = require('lodash');
var RateLimiter = require('./memory');
var pf = require('loopback-policy');
var Policy = pf.Policy;
var Rule = pf.Rule;

var debug = require('debug')('loopback:policy:rate-limiting');

// First define object types for facts. There will be LoopBack models.
function modelingFacts() {
// Mock up the Context model
  var Context = function(req, res) {
    this.req = req;
    this.res = res;
    this.limits = {};
  };

// Mock up the Application model
  var Application = function(id, name) {
    this.id = id;
    this.name = name;
  };

// Mock up the User model
  var User = function(id, username, email) {
    this.id = id;
    this.username = username;
    this.email = email;
  };

  return {
    Context: Context,
    Application: Application,
    User: User
  };
}

var models = modelingFacts();

module.exports = function(options) {
  options = options || {};
  debug('Options: %j', options);

// A global counters
  var rateLimiter = new RateLimiter({
    interval: options.interval || 1000,
    limit: options.limit || 10});

  var keyDefs = {};
  if (options.keys) {
    for (var k in options.keys) {
      var key = options.keys[k];
      if (typeof key === 'number') {
        keyDefs[k] = {
          limit: key,
          template: _.template(k + '-${' + k + '}')
        };
      } else {
        keyDefs[k] = {
          limit: key.limit,
          template: key.template && _.template(key.template)
        };
      }
    }
  }
  debug('Keys: %j', keyDefs);

  function getHandler(session, key, next) {
    var ctx = session.getFacts(models.Context)[0];
    return function(err, result) {
      if (ctx.proceed === false) {
        return next();
      }
      var res = ctx.res;
      ctx.limits = ctx.limits || {};
      ctx.limits[key] = result;
      res.setHeader('X-RateLimit-Key', key);
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset);
      ctx.proceed = result.isAllowed;
      if (!result.isAllowed) {
        res.status(429).json({error: 'Limit exceeded'});
        session.halt();
      }
      next();
    };
  }

  function limitRate(keyName, session, facts, next) {
    debug('Action fired - Limit by %s', keyName);
    var key = keyDefs[keyName].template(facts);
    rateLimiter.enforce(key, {limit: keyDefs[keyName].limit},
      getHandler(session, key, next));
  }

  var ruleForApp = new Rule(
    'Limit requests based on application id',
    [
      [models.Context, 'c', function(facts) {
        var ctx = facts.c;
        return ctx.proceed === undefined;
      }],
      [models.Application, 'app']
    ],
    function(facts, session, next) {
      limitRate('app', session, facts, next);
    });

  var ruleForUser = new Rule(
    'Limit requests based on user id',
    [
      [models.User, 'user']
    ],
    function(facts, session, next) {
      limitRate('user', session, facts, next);
    });

  var ruleForAppAndUser = new Rule(
    'Limit requests based on application and user',
    [
      [models.Application, 'app'],
      [models.User, 'user']
    ],
    function(facts, session, next) {
      limitRate('app,user', session, facts, next);
    });

  var ruleForIp = new Rule(
    'Limit requests based on remote ip',
    [
      [models.Context, 'c'],
      [String, 'ip', 'from c.req.ip']
    ], function(facts, session, next) {
      limitRate('ip', session, facts, next);
    });

  var ruleForUrl = new Rule(
    'Limit requests based on url',
    [
      [models.Context, 'c'],
      [String, 'url', 'from c.req.originalUrl']
    ], function(facts, session, next) {
      facts.urlPaths = facts.url.split(/\/|\?/).filter(Boolean);
      limitRate('url', session, facts, next);
    });

  var policy = new Policy('Rate Limiting',
    [ruleForApp, ruleForUser, ruleForAppAndUser, ruleForIp, ruleForUrl]);

  function buildFacts(ctx, cb) {
    var facts = [];
    var req = ctx.req;
    if (req.accessToken) {
      req.accessToken.user(function(err, u) {
        if (err) {
          return cb(err);
        }
        if (u) {
          facts.push(new models.User(u.id, u.username, u.email));
        }
        req.accessToken.application(function(err, a) {
          if (err) {
            return cb(err);
          }
          if (a) {
            facts.push(new models.Application(a.id, a.name));
          }
          cb(null, facts);
        });
      });
    } else {
      cb(null, facts);
    }
  }

  return function enforceRateLimitingPolicy(req, res, next) {
    var ctx = new models.Context(req, res);
    buildFacts(ctx, function(err, facts) {
      if (err) {
        return next(err);
      }
      var session = policy.execute(ctx, facts, function(err) {
        if (err) {
          return next(err);
        }
        debug('Rule matching is done');
        // session.print();
        var ctx = session.getFacts(models.Context)[0];
        if (ctx.limits) {
          debug('Limits: %j', ctx.limits);
        }
        if (ctx.proceed) {
          next();
        }
      });
    });
  };

};






