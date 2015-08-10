var expect = require('chai').expect;
var transpilePoliciesToMiddleware = require('../server/policy-middleware');

describe('policy to middleware transpilation', function() {

  it('should transpile test policy-config.json to middleware.json', function() {
    var policyConfig = require('../test/test-policy-config.json');
    var middleware = transpilePoliciesToMiddleware(policyConfig);
    var expectedResult = {
      'auth': {
        'loopback-component-oauth2#authenticate': [{
          'methods': ['get'],
          'paths': ['/api/catalog'],
          'params': {'scopes': ['catalog', 'shopping']}
        }, {
          'paths': ['/api/invoices'],
          'params': {'scopes': ['catalog', 'shopping']}
        }]
      },
      'auth:after': {
        './middleware/rate-limiting-policy': [{
          'methods': ['get'],
          'paths': ['/api/catalog'],
          'params': {'interval': 60000, 'limit': 1000}
        }, {
          'paths': ['/api/invoices'],
          'params': {'interval': 60000, 'limit': 1000}
        }]
      },
      'final': {
        './middleware/proxy': [
          {
            'methods': [
              'get'
            ],
            'params': {
              'rules': [
                '/api/catalog https://server1.example.com/api/catalog [P]'
              ]
            }
          },
          {
            'params': {
              'rules': [
                '/api/invoices https://server1.example.com/api/catalog [P]'
              ]
            }
          }
        ]
      }
    };
    expect(middleware).to.eql(expectedResult);
  });

  it('should transpile gateway policy-config.json to middleware.json',
    function() {
      var policyConfig = require('../server/policy-config.json');
      var middleware = transpilePoliciesToMiddleware(policyConfig);
      var expectedResult = {
        'initial:before': {
          'strong-express-metrics': [{
            paths: ['^/api/(.*)$', '^/protected/(.*)$', '/api/notes'],
            params: {}
          }]
        },
        auth: {
          'loopback-component-oauth2#authenticate': [{
            paths: ['^/api/(.*)$'],
            params: {scopes: []}
          },
            {
              paths: ['^/protected/(.*)$', '/api/notes'],
              params: {scopes: ['demo']}
            },
            {paths: ['/api/notes'], params: {scopes: ['note', 'demo']}}]
        },
        'routes:after': {
          './middleware/rate-limiting-policy': [{
            paths: ['^/api/(.*)$', '^/protected/(.*)$', '/api/notes'],
            params: {
              limit: 100,
              interval: 60000,
              keys: {
                app: {template: 'app-${app.id}', limit: 1000},
                ip: 500,
                url: {
                  template: 'url-${urlPaths[0]}/${urlPaths[1]}',
                  limit: 1000
                },
                user: {template: 'user-${user.id}', limit: 1000},
                'app,user': {
                  template: 'app-${app.id}-user-${user.id}',
                  limit: 1000
                }
              }
            }
          }]
        },
        proxies: {
          './middleware/proxy': [{
            params: {
              rules: ['^/api/(.*)$ http://localhost:3002/api/$1 [P]',
                '/api/notes http://localhost:3002/api/$1 [P]']
            }
          }, {
            params: {
              rules:
                ['^/protected/(.*)$ http://localhost:3000/protected/$1 [P]']
            }
          }]
        }
      };
      expect(middleware).to.eql(expectedResult);
    })
  ;
})
;
