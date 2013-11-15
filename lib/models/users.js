var oauth2 = require('./oauth2');

exports.find = function(id, done) {
    console.log("users.find(" + id + ")");
    schema.User.findOne({
        id : id
    }, done);
};

exports.findByUsername = function(username, done) {
    console.log("users.findByUsername(" + username + ")");
    oauth2.User.findOne({
        name : username
    }, done);
};

exports.save = function(id, username, password, done) {
    console.log("users.save(" + username + ")");
    oauth2.User.create({
        id : id,
        name : username,
        password : password
    }, done);
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
