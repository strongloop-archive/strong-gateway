var oauth2 = require('./oauth2');

exports.find = function (key, done) {
  oauth2.ClientRegistration.findOne({
    clientId: key
  }, done);
};

exports.clean = function () {
  oauth2.ClientRegistration.deleteAll(function (err, client) {
    if (err) console.log(err);
  });
};

exports.save = function (clientId, clientSecret, name, email, description, url, iconURL, redirectURIs, type, userId, done) {

  oauth2.ClientRegistration.create({
    clientId: clientId,
    clientSecret: clientSecret,
    defaultTokenType: "Bearer",
    accessLevel: 1,
    disabled: false,
    name: name,
    email: email,
    description: description,
    url: url,
    iconURL: iconURL,
    redirectURIs: redirectURIs,
    type: "CONFIDENTIAL",
    userId: userId,
  }, done);
};

exports.findByClientId = function (clientID, done) {
  oauth2.ClientRegistration.findOne({
    clientId: clientID
  }, done);
};

exports.register = function (clientId, clientSecret, name, email, description, userId, done) {
  exports.findByClientId(clientId, function (err, client) {
    if (err) {
      console.log(err);
      if (done)
        done(err);
    } else if (client) {
      console.log("Client found: " + JSON.stringify(client));
      if (done)
        done(null, client);
    } else {
      exports.save(clientId, clientSecret, name, email, description, null, null, null, "CONFIDENTIAL", userId, function (err, obj) {
        if (err) {
          console.log(err);
          if (done)
            done(err);
        } else {
          console.log("Client created: " + JSON.stringify(obj));
          if (done)
            done(null, obj);
        }
      });
    }
  });
}
