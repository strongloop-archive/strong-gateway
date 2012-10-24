var schema = require('./mongo_schema');

exports.find = function(key, done) {
    schema.OAuthAuthorizationCode.findOne({
        code : key
    }, done);
};

exports.save = function(code, clientID, redirectURI, userID, done) {
    console.log("Saving " + code);
    var oauthCode = new schema.OAuthAuthorizationCode({
        code : code,
        redirectURI : redirectURI,
        resourceOwner : userID,
        clientId : clientID
    });
    oauthCode.save(done);
};
