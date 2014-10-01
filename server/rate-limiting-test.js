var form = {
  grant_type: 'client_credentials'
};

var request = require('request');
request.post({
  url: 'https://localhost:3001/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  },
  auth: {
    user: '123',
    pass: 'secret'
  },
  strictSSL: false,
  form: form
}, function(err, res, body) {
  var obj = JSON.parse(body);
  console.log(obj.access_token);

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

