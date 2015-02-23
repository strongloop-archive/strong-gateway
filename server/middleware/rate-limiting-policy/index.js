'use strict';
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

  function getHandler(session, key, next) {
    var ctx = session.getFacts(models.Context)[0];
    return function(err, result) {
      if (ctx.proceed === false) {
        return next();
      }
      var res = ctx.res;
      ctx.limits = ctx.limits || {};
      ctx.limits[key] = result;
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

  var ruleForAppAndUser = new Rule(
    'Limit requests based on application and user',
    [
      [models.Context, 'c', function(facts) {
        var ctx = facts.c;
        return ctx.proceed === undefined;
      }],
      [models.Application, 'a'],
      [models.User, 'u', 'u.username == "bob"']
    ],
    function(facts, session, next) {
      debug('Action fired - Limit by app/user: %j %j', facts.a, facts.u);
      var key = 'App-' + facts.a.id + '-User-' + facts.u.id;
      rateLimiter.enforce(key, getHandler(this, key, next));
    });

  var ruleForIp = new Rule(
    'Limit requests based on remote ip',
    [
      [models.Context, 'c', function(facts) {
        var ctx = facts.c;
        return ctx.proceed === undefined;
      }],
      [String, 'ip', 'ip == "127.0.0.1" || ip == "::1"', 'from c.req.ip']
    ], function(facts, session, next) {
      debug('Action fired - Limit by ip: %s', facts.ip);
      var key = 'IP-' + facts.ip;
      rateLimiter.enforce(key, getHandler(session, key, next));
    });

  var ruleForUrl = new Rule(
    'Limit requests based on url',
    [
      [models.Context, 'c', function(facts) {
        var ctx = facts.c;
        return ctx.proceed === undefined;
      }],
      [String, 'url', 'from c.req.url']
    ], function(facts, session, next) {
      debug('Action fired - Limit by url: %s', facts.url);
      var key = 'URL-' + facts.url.split('/')[1];
      rateLimiter.enforce(key, getHandler(session, key, next));
    });

  var policy = new Policy('Rate Limiting',
    [ruleForAppAndUser, ruleForIp, ruleForUrl]);

  function buildFacts(ctx, cb) {
    var facts = [];
    var req = ctx.req;
    if (req.accessToken) {
      req.accessToken.user(function(err, u) {
        if (err) {
          return cb(err);
        }
        facts.push(new models.User(u.id, u.username, u.email));
        req.accessToken.application(function(err, a) {
          if (err) {
            return cb(err);
          }
          facts.push(new models.Application(a.id, a.name));
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
          debug(ctx.limits);
        }
        if (ctx.proceed) {
          next();
        }
      });
    });
  };

};






