var request = require('request');

// Build the token request using client_credentials grant type
var form = {
  grant_type: 'client_credentials'
};

// Request the access token
request.post({
  url: 'https://localhost:3001/oauth/token',
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
  var obj = JSON.parse(body);
  console.log(obj.access_token);

  // Request a protected resources in a loop
  for (var i = 0; i < 150; i++) {
    request.get('https://localhost:3001/api/notes?access_token=' + obj.access_token,
      {strictSSL: false},
      function(err, res) {
        console.log('Limit %d Remaining: %d Reset: %d',
          res.headers['x-ratelimit-limit'],
          res.headers['x-ratelimit-remaining'],
          res.headers['x-ratelimit-reset']);
      });
  }
});

