/*
 * Report API usage events to IBM APIm backend.
 */
'use strict';
var debug = require('debug')('strong-gateway:activity-log');
var fs = require('fs');
var request = require('request');
var qs = require('querystring');
var url = require('url');
var uuid = require('uuid');

var REQUEST_HEADERS = {
  'accept': '*/%'
};

module.exports = function createActivityLogMiddleware(options) {
  debug('configuration', options);

  var auth = options.connection.auth;
  if (!auth) auth = options.connection.auth = {};

  if (!auth.key && auth.keyFile) {
    auth.key = fs.readFileSync(auth.keyFile);
  }
  if (!auth.cert && auth.certFile) {
    auth.cert = fs.readFileSync(auth.certFile);
  }

  return function logActivity(req, res, next) {
    if (!req.__start) {
      req.__start = new Date();
    }

    if (!req.__clientAddress) {
      // Save the client address, as it is not available in Node v0.10
      // at the time when the response was sent
      req.__clientAddress = req.ip || req.connection.remoteAddress;
    }

    res.on('finish', function() {
      if (!res.durationInMs) {
        res.durationInMs = new Date() - req.__start;
      }

      processActivity(req, res, options);
    });
    next();
  };
};

function processActivity(req, res, config) {
  var event = buildApiEvent(req, res, config);
  publishApiEvent(event, config);
}

function buildApiEvent(request, response, config) {
  var urlParts = url.parse(request.originalUrl || request.url);

  // ?num=1&str=hello => [ { "num": "1" }, { "str": "hello" } ]
  var query = qs.parse(urlParts.query);
  var queryArray = Object.keys(query).map(function(k) {
    var item = Object.create(null);
    item[k] = query[k];
    return item;
  });

  return {
    requestMethod: request.method,
    uriPath: urlParts.pathname,
    queryString: queryArray,
    transactionId: uuid.v4(),
    statusCode: String(response.statusCode),
    timeToServeRequest: response.duration,
    source: request.__clientAddress,
    datetime: request.__start.toISOString(),

    // Everything below are dummy placeholders for now

    // TODO(ritch) Get these values from the upcoming gateway context
    orgId: config.orgId,
    envId: config.envId,

    // TODO(bajtos)
    bytesSent: 0,
    bytesReceived: 0,
    remoteHost: '',
    userAgent: '',
    requestProtocol: 'http',

    // TODO(ritchie) Needs the upcoming gateway context
    apiVersion: '',
    apiId: '',
    resourceId: '',
    apiUser: '',

    // Needs integration with APIm config and additional req/res interceptors
    responseBody: '',
    requestBody: '',
    responseHttpHeaders: [],
    requestHttpHeaders: [],

    // Optional (?)
    debug: [],
    planId: '',
    logPolicy: '',
  };
}

function publishApiEvent(event, config) {
  var auth = config.connection.auth;
  var requestOptions = {
    url: config.connection.url,
    agentOptions: {
      key: auth.key,
      cert: auth.cert,
      passphrase: auth.passphrase,
      rejectUnauthorized: auth.rejectUnauthorized,
    },
    headers: REQUEST_HEADERS,
    body: [
      {
        create: {
          _type: 'apievent',
          _index: config.orgId
        }
      },
      event,
    ].map(JSON.stringify).join('\n') + '\n',
  };

  debug('Uploading to %s\n%s', requestOptions.url, requestOptions.body);
  request.post(requestOptions, function(err, response/*, body*/) {
    if (err) {
      return debug('Cannot upload APIm events', err);
    }
    if (response.statusCode >= 400) {
      return debug('Cannot upload APIm events: status code %s\n%s',
                   response.statusCode, response.body);
    }
    debug('APIm event(s) uploaded.');
  });
}
