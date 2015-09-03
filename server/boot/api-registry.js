var policyConfig = require('../policy-config.json');
var Registry = require('strong-api-registry');
var path = require('path');

module.exports = function(app) {
  var route = app.get('apiRegistryRoute');
  var policyMiddleware = require('../policy-middleware')(policyConfig);

  var proxyRoutes = getProxyRoutes();
  var registry = new Registry();

  registry.import(path.join(__dirname, '..', '..', 'swagger', '*.swagger.json'));

  var GATEWAY_HOST = 'api.company.com';
  var spec = registry.get(GATEWAY_HOST);

  proxyRoutes.forEach(function(route) {
    spec
      .call('proxy', {
        verb: route.mapping.verb,
        route: route.mapping.endpoint,
        target: {
          verb: route.proxyPolicy.verb || 'get',
          url: route.proxyPolicy.targetURL
        }
      });
  });

  app.get(route, function(req, res) {
    spec
      .call('toSwagger')
      .then(res.send.bind(res));
  });
}

function getProxyRoutes() {
  var proxyRoutes = [];

  policyConfig.mappings.forEach(function(mapping) {
    var proxyPolicy = proxyPolicyForMapping(mapping);
    if (proxyPolicy) {
      proxyRoutes.push({
        mapping: mapping,
        proxyPolicy: proxyPolicy
      });
    }
  });

  return proxyRoutes;
}

function proxyPolicyForMapping(mapping) {
  var pipeline = getPipelineForMapping(mapping);

  if(!pipeline) return false;

  var policies = pipeline.policyIds
  var policy;

  for(var i = 0; i < policies.length; i++) {
    policy = getPolicyById(policies[i]);
    if (policy.type === 'reverseProxy') {
      return policy;
    }
  }
  return false;
}

function getPipelineForMapping(mapping) {
  var result;
  policyConfig.pipelines.forEach(function(pipeline) {
    if (pipeline.name === mapping.pipelineId) {
      result = pipeline;
    }
  });
  return result;
}

function policyIsProxy(policyId) {
  var policies = policyConfig.policies;
  for (var i = 0; i < policies.length; i++) {
    if (policyId === policies[i].name) {
      return policies[i].type === 'reverseProxy';
    }
  }

  return false;
}

function getPolicyById(id) {
  var policies = policyConfig.policies;
  for (var i = 0; i < policies.length; i++) {
    if (id === policies[i].name) {
      return policies[i];
    }
  }

  return false;
}
