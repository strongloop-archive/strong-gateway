var schema = require('./mongo_schema');

exports.find = function(key, done) {
    schema.OAuthAuthorizationCode.findOne({
        code : key
    }, done);
};

exports.save = function(code, clientID, redirectURI, userID, scopes, done) {
    console.log("Saving " + code);
    var oauthCode = new schema.OAuthAuthorizationCode({
        code : code,
        scopes : scopes,
        redirectURI : redirectURI,
        resourceOwner : userID,
        clientId : clientID
    });
    oauthCode.save(done);
};
