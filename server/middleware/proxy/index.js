var debug = require('debug')('loopback:gateway:proxy');
var httpProxy = require('http-proxy');

function setupHeaders(proxyReq, req) {
  if(!req.authInfo) {
    return;
  }
  var clientApp = req.authInfo.app;
  var clientId = clientApp && clientApp.id;
  var user = req.authInfo.user || req.user;
  var userId = user && user.id;
  if(clientId) {
    debug('X-Client-ID: %s', clientId);
    proxyReq.setHeader('X-Client-ID', clientId);
  }
  if(userId) {
    debug('X-User-ID: %s', userId);
    proxyReq.setHeader('X-User-ID', userId);
  }
}

function createProxy(options) {
  options = options || {};
  var proxy = httpProxy.createProxyServer(options);

  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    setupHeaders(proxyReq, req);
    if(typeof options.beforeRequest === 'function') {
      options.beforeRequest(proxyReq, req, res, options);
    }
  });

  proxy.on('proxyRes', function(proxyRes, req, res) {
    if(typeof options.afterResponse === 'function') {
      options.afterResponse(proxyRes, req, res);
    }
  });

  proxy.on('error', function(err, req, res) {
    var proxyErr = new Error('Proxy error');
    proxyErr.url = req.url;
    proxyErr.target = req.target;
    proxyErr.cause = err;
    res.status(500).send(proxyErr);
  });

  options = options || {};
  var router = options.router;

  var handler = function(req, res, next) {
    var target = options.target || 'http://localhost:3002/';
    if (typeof router === 'function') {
      target = router(req);
    }
    req.target = target;
    proxy.web(req, res, {target: target});
  };

  handler.proxy = proxy;
  return handler;
}

// Folked from https://github.com/tinganho/connect-modrewrite/blob/master/index.js (MIT License)
/**
 * Module dependencies
 */

var url = require('url');

/**
 * Syntaxes
 */

var noCaseSyntax = /NC/
  , lastSyntax = /L/
  , proxySyntax = /P/
  , redirectSyntax = /R=?(\d+)?/
  , forbiddenSyntax = /F/
  , goneSyntax = /G/
  , typeSyntax = /T=([\w|\/]+,?)/
  , hostSyntax = /H=([^,]+)/
  , flagSyntax = /\[(.*)\]$/
  , partsSyntax = /\s+|\t+/g

function urlRewrite(rules) {
// Parse the rules to get flags, replace and match pattern
  rules = _parse(rules);

  return function(req, res, next) {
    var callNext = true;

    rules.some(function(rule) {

      if (rule.host) {
        if (!rule.host.test(req.headers.host)) {
          return false;
        }
      }

      var match = rule.regexp.test(req.url);

      // If not match
      if (!match) {
        // Inverted rewrite
        if (rule.inverted) {
          req.url = rule.replace;
          return rule.last;
        }

        return false;
      }

      // Type
      if (rule.type) {
        res.setHeader('Content-Type', rule.type);
      }

      // Gone
      if (rule.gone) {
        res.status(410);
        res.end();
        callNext = false;
        return true;
      }

      // Forbidden
      if (rule.forbidden) {
        res.status(403);
        res.end();
        callNext = false;
        return true;
      }

      // Proxy
      if (rule.proxy) {
        var target = url.parse(req.url.replace(rule.regexp, rule.replace));
        req.url = target.path;
        target = target.protocol + '//' + target.host;
        debug('Proxy %s', target);
        var proxy = createProxy({target: target});
        proxy(req, res, next);
        callNext = false;
        return true;
      }

      // Redirect
      if (rule.redirect) {
        res.redirect(rule.redirect);
        callNext = false;
        return true;
      }

      // Rewrite
      if (!rule.inverted) {
        req.url = req.url.replace(rule.regexp, rule.replace);
        return rule.last;
      }
    });

    if (callNext) {
      next();
    }

  };
}
/**
 * Export `API`
 */

module.exports = function(options) {
  options = options || {};
  var rules = options.rules || [];
  return urlRewrite(rules);
};

/**
 * Get flags from rule rules
 *
 * @param {Array.<rules>} rules
 * @return {Object}
 * @api private
 */

function _parse(rules) {
  return (rules || []).map(function(rule) {
    // Reset all regular expression indexes
    lastSyntax.lastIndex = 0;
    proxySyntax.lastIndex = 0;
    redirectSyntax.lastIndex = 0;
    forbiddenSyntax.lastIndex = 0;
    goneSyntax.lastIndex = 0;
    typeSyntax.lastIndex = 0;
    hostSyntax.lastIndex = 0;

    var parts = rule.replace(partsSyntax, ' ').split(' '), flags = '';

    if (flagSyntax.test(rule)) {
      flags = flagSyntax.exec(rule)[1];
    }

    // Check inverted urls
    var inverted = parts[0].substr(0, 1) === '!';
    if (inverted) {
      parts[0] = parts[0].substr(1);
    }

    var redirectValue = redirectSyntax.exec(flags)
      , typeValue = typeSyntax.exec(flags)
      , hostValue = hostSyntax.exec(flags);

    return {
      regexp: typeof parts[2] !== 'undefined' && noCaseSyntax.test(flags) ?
        new RegExp(parts[0], 'i') : new RegExp(parts[0]),
      replace: parts[1],
      inverted: inverted,
      last: lastSyntax.test(flags),
      proxy: proxySyntax.test(flags),
      redirect: redirectValue ? (typeof redirectValue[1] !== 'undefined' ?
        redirectValue[1] : 301) : false,
      forbidden: forbiddenSyntax.test(flags),
      gone: goneSyntax.test(flags),
      type: typeValue ? (typeof typeValue[1] !== 'undefined' ?
        typeValue[1] : 'text/plain') : false,
      host: hostValue ? new RegExp(hostValue[1]) : false
    };
  });
}



