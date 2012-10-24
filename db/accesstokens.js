var schema = require('./mongo_schema');

exports.find = function(key, done) {
    schema.OAuthToken.findOne({
        accessToken : key
    }, done);
};

exports.save = function(token, clientId, resourceOwner, scopes, done) {
    console.log("Saving token: " + token);
    var oauthToken = new schema.OAuthToken({
        accessToken : token,
        clientId : clientId,
        resourceOwner : resourceOwner,
        scopes : scopes,
        issuedAt : new Date(),
        expiresIn : 3600
    });
    oauthToken.save(done);
};
