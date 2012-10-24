var schema = require('./mongo_schema');

exports.users = require('./users');
exports.clients = require('./clients');
exports.accessTokens = require('./accesstokens');
exports.authorizationCodes = require('./authorizationcodes');

// Register the dummy users and clients

exports.users.register("001", "bob", "secret");
exports.users.register("002", "joe", "password");

exports.clients.register("abc123", "ssh-secret", "Test App", "abc123@example.com", "Abc 123", "bob");