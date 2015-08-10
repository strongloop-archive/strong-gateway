var debug = require('debug')('strong-gateway:policy');
var util = require('util');
module.exports = transpilePoliciesToMiddleware;

function print(obj) {
  if (debug.enabled) {
    return util.inspect(obj, {depth: null});
  } else {
    return '';
  }
}

function transpilePoliciesToMiddleware(policyConfig, options) {
  if (!(policyConfig && typeof policyConfig === 'object')) {
    return {};
  }
  options = options || {};
  var mappings = policyConfig.mappings || [];
  var pipelines = policyConfig.pipelines || [];
  var policies = policyConfig.policies || [];

  var policyAttachments = {}; // {policyName: [map1, map2]
  var middleware = {};
  mappings.forEach(function(map) {
    debug('Map: %j', map);
    var pipeline = findPipeline(pipelines, map.pipelineId);
    if (pipeline) {
      debug('Pipeline: %j', pipeline);
      var policyIds = pipeline.policyIds || [];
      for (var i = 0, n = policyIds.length; i < n; i++) {
        var policy = findPolicy(policies, policyIds[i]);
        if (policy) {
          debug('Policy: %j', policy);
          var attachedMaps = policyAttachments[policy.name];
          if (!attachedMaps) {
            attachedMaps = [];
            attachedMaps.policy = policy;
            policyAttachments[policy.name] = attachedMaps;
          }
          attachedMaps.push(map);
        }
      }
    }
  });

  function registerMiddleware(middlewareEntry) {
    if (middlewareEntry) {
      var phase = middlewareEntry.phase;
      var name = middlewareEntry.name;
      if (!middleware[phase]) {
        middleware[phase] = {};
      }
      middleware[phase][name] = middleware[phase][name] || [];
      var entry = {
        params: middlewareEntry.params
      };
      if (middlewareEntry.paths) {
        entry.paths = middlewareEntry.paths;
      }
      if (Array.isArray(middlewareEntry.methods) &&
        middlewareEntry.methods.indexOf('all') === -1) {
        // Only add methods if it's not empty and not all
        entry.methods = middlewareEntry.methods;
      }
      debug('Add middleware %s to phase %s: %s', phase, name, print(entry));
      middleware[phase][name].push(entry);
    }
  }

  for (var p in policyAttachments) {
    var policy = policyAttachments[p].policy;
    var routes = policyAttachments[p];

    var entries = mapPolicyToMiddleware(routes, policy);
    entries.forEach(registerMiddleware);
  }
  debug('Middleware for policies: %s', print(middleware));
  return middleware;
}

function findPipeline(pipelines, id) {
  for (var i = 0, n = pipelines.length; i < n; i++) {
    if (pipelines[i].name === id) {
      return pipelines[i];
    }
  }
  return null;
}

function findPolicy(policies, id) {
  for (var i = 0, n = policies.length; i < n; i++) {
    if (policies[i].name === id) {
      return policies[i];
    }
  }
  return null;
}

function proxyPolicyMapper(map, policy, params) {
  var entry = {
    name: './middleware/proxy',
    phase: policy.phase,
    methods: map.methods
    // Do not register paths as they will be part of the rules
  };
  var target = params.targetURL || params.target || params.url;
  if (target) {
    params = {
      rules: map.paths.map(function(path) {
        return path + ' ' + target + ' [P]';
      })
    };
  }
  entry.params = params;
  return entry;
}

transpilePoliciesToMiddleware.policyToMiddlewareMapping = {
  auth: 'loopback-component-oauth2#authenticate',
  proxy: proxyPolicyMapper,
  reverseProxy: proxyPolicyMapper,
  rateLimiting: './middleware/rate-limiting-policy',
  metrics: 'strong-express-metrics'
};

function normalizeMethods(items) {
  if (typeof items === 'string') {
    items = items.split(/[,\s]+/).filter(Boolean).map(function(item) {
      return item.toLowerCase();
    });
  }
  return items;
}

function normalizePaths(items) {
  if (typeof items === 'string') {
    items = items.split(/[,\s]+/).filter(Boolean);
  }
  return items;
}

/**
 * Is arr1 a superset of arr2
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns true/false
 */
function isSuperSet(arr1, arr2) {
  arr1 = arr1 || [];
  arr2 = arr2 || [];
  if (arr1.length === 0) {
    return false;
  }
  return arr1.every(function(val) {
    return arr2.indexOf(val) >= 0;
  });
}

/**
 * Merge a route into the list of routes if the methods are compatible
 * @param {Object[]} routes A list of routes
 * @param {Object} r The route
 * @returns {*}
 */
function mergeRoute(routes, r) {
  for (var i = 0, n = routes.length; i < n; i++) {
    if (routes[i].methods.indexOf('all') !== -1 ||
      isSuperSet(r.methods, routes[i].methods)) {
      for (var j = 0, k = r.paths.length; j < k; j++) {
        var p = r.paths[j];
        if (routes[i].paths.indexOf(p) === -1) {
          routes[i].paths.push(p);
        }
      }
      return routes[i];
    }
  }
  routes.push(r);
  return r;
}

/**
 * Map policy attachments to middleware config
 * @param {Object[]} routes A list of routes
 * @param {Object} policy Policy definition
 * @returns {*}
 */
function mapPolicyToMiddleware(routes, policy) {
  var name =
    transpilePoliciesToMiddleware.policyToMiddlewareMapping[policy.type];
  if (!name) {
    return null;
  }
  var params = {};
  for (var p in policy) {
    if (p === 'name' || p === 'type' || p === 'phase') continue;
    params[p] = policy[p];
  }
  var endpoints = [];
  routes.forEach(function(r) {
    r.methods = normalizeMethods(
      r.verb || r.method || r.verbs || r.methods);
    r.paths = normalizePaths(r.endpoint || r.path || r.endpoints || r.paths);
    mergeRoute(endpoints, r);
  });
  var entries = endpoints.map(function(map) {
    var entry;
    if (typeof name === 'function') {
      entry = name(map, policy, params);
    } else {
      entry = {
        name: name,
        phase: policy.phase,
        methods: map.methods,
        paths: map.paths,
        params: params
      };
    }
    debug('Middleware for policy %s: %s', policy.name, print(entry));
    return entry;
  });
  return entries;
}
