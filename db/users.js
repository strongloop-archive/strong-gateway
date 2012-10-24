var schema = require('./mongo_schema');

exports.find = function(id, done) {
    console.log("users.find(" + id + ")");
    schema.User.findOne({
        id : id
    }, done);
};

exports.findByUsername = function(username, done) {
    console.log("users.findByUsername(" + username + ")");
    schema.User.findOne({
        name : username
    }, done);
};

exports.save = function(id, username, password, done) {
    console.log("users.save(" + username + ")");
    var user = new schema.User({
        id : id,
        name : username,
        password : password
    });
    user.save(done);
};

exports.register = function(id, username, password, done) {
    exports.findByUsername(username, function(err, user) {
        if (err) {
            console.log(err);
            if (done)
                done(err);
        } else if (user) {
            console.log("User found: " + JSON.stringify(user));
            if (done)
                done(null, user);
        } else {
            exports.save(id, username, password, function(err, obj) {
                if (err) {
                    console.log(err);
                    if (done)
                        done(err)
                } else {
                    console.log("User created: " + JSON.stringify(obj));
                    if (done)
                        done(null, user);
                }
            });
        }
    });
};
