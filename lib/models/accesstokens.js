var oauth2 = require('./oauth2');

exports.find = function (key, done) {
  oauth2.OAuthToken.findOne({
    accessToken: key
  }, done);
};

exports.save = function (token, clientId, resourceOwner, scopes, done) {
  oauth2.OAuthToken.create({
    accessToken: token,
    clientId: clientId,
    resourceOwner: resourceOwner,
    scopes: scopes,
    issuedAt: new Date(),
    expiresIn: 3600
  }, done);
};
