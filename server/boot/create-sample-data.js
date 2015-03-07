var async = require('async');
var data = require('../sample-data.json');
var sslCert = require('../private/ssl_cert');

module.exports = function(app, cb) {
  signupTestUserAndApp(app, cb);
};

function signupTestUserAndApp(app, cb) {
  var appModel = app.loopback.getModelByType(app.models.Application);
  // Hack to set the app id to a fixed value so that we don't have to change
  // the client settings
  appModel.beforeSave = function(next) {
    for (var i = 0, n = data.applications.length; i < n; i++) {
      if (data.applications[i].name === this.name) {
        this.id = data.applications[i].id;
        this.restApiKey = data.applications[i].restApiKey;
        this.publicKey = sslCert.certificate;
      }
    }
    next();
  };

  function createUsers(done) {
    async.each(data.users, function createUser(user, done) {
      app.models.User.create(user, function(err, user) {
        if (!err) {
          console.log('User registered: id=%s username=%s password=%s',
            user.id, user.username, 'secret');
        }
        done(err);
      });
    }, done);
  }

  function createApplications(done) {
    async.each(data.applications,
      function createApplication(application, done) {
        appModel.create(application, function(err, application) {
          if (!err) {
            console.log(
              'Client application registered: id=%s name=%s key=%s',
              application.id, application.name, application.restApiKey);
          }
          done(err);
        });
      }, done);
  }

  async.parallel([createUsers, createApplications], cb);
}
