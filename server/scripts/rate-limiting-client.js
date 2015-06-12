/* jshint camelcase: false */
var request = require('request');

// Build the token request using client_credentials grant type
var form = {
  grant_type: 'password',
  username: 'bob',
  password: 'secret',
  scope: 'demo'
};

function printRateLimitHeaders(err, res) {
  console.log('%s: Limit %d Remaining: %d Reset: %d',
    res.headers['x-ratelimit-key'] || null,
    res.headers['x-ratelimit-limit'] || null,
    res.headers['x-ratelimit-remaining'] || null,
    res.headers['x-ratelimit-reset'] || null);
}

var port = process.env.PORT || 3001;
var count = Number(process.argv[2]) || 500;

// Request the access token
request.post({
  url: 'https://localhost:' + port + '/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  },
  // Use the client id/secret in the Authorization header
  auth: {
    user: '123',
    pass: 'secret'
  },
  // Allow self-signed SSL certs
  strictSSL: false,
  form: form
}, function(err, res, body) {
  if (err) {
    console.error(err);
    return;
  }
  if (res.statusCode !== 200) {
    console.error(res.statusCode, body);
    return;
  }
  var obj;
  try {
    obj = JSON.parse(body);
  } catch (err) {
    console.error(err, body);
    return;
  }
  console.log('Access Token: %s', obj.access_token);

  // Request a protected resources in a loop
  for (var i = 0; i < count; i++) {
    request.get('https://localhost:' + port + '/api/notes?access_token=' +
      obj.access_token,
      {strictSSL: false},
      printRateLimitHeaders);
  }
});

