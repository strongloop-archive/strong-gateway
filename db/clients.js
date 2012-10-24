var schema = require('./mongo_schema');

exports.find = function(key, done) {
    schema.ClientRegistration.findOne({
        id : key
    }, done);
};

exports.save = function(clientId, clientSecret, name, email, description, url, iconURL, redirectURIs, type, userId,
        done) {

    var client = new schema.ClientRegistration({
        clientId : clientId,
        clientSecret : clientSecret,
        defaultTokenType : "Bearer",
        accessLevel : 1,
        disabled : false,
        name : name,
        email : email,
        description : description,
        url : url,
        iconURL : iconURL,
        redirectURIs : redirectURIs,
        type : "CONFIDENTIAL",
        userId : userId,
    });
    client.save(done);
};

exports.findByClientId = function(clientID, done) {
    schema.ClientRegistration.findOne({
        clientId : clientID
    }, done);
};

exports.register = function(clientId, clientSecret, name, email, description, userId, done) {
    exports.findByClientId(clientId, function(err, client) {
        if (err) {
            console.log(err);
            if (done)
                done(err);
        } else if (client) {
            console.log("Client found: " + JSON.stringify(client));
            if (done)
                done(null, client);
        } else {
            exports.save(name, email, description, null, null, null, "CONFIDENTIAL", userId, function(err, obj) {
                if (err) {
                    console.log(err);
                    if (done)
                        done(err);
                } else {
                    console.log("Client created: " + JSON.stringify(user));
                    if (done)
                        done(null, obj);
                }
            });
        }
    });
}
