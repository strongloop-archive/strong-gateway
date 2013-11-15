var oauth2 = require('./oauth2');

exports.find = function (key, done) {
  oauth2.OAuthAuthorizationCode.findOne({
    code: key
  }, done);
};

exports.save = function (code, clientID, redirectURI, userID, scopes, done) {
  oauth2.OAuthAuthorizationCode.create({
    code: code,
    scopes: scopes,
    redirectURI: redirectURI,
    resourceOwner: userID,
    clientId: clientID
  }, done);
};
