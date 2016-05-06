// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var app = require('../server/server');

module.exports = function(done) {
  if (app.loaded) {
    app.once('started', done);
    app.start();
  } else {
    app.once('loaded', function() {
      app.once('started', done);
      app.start();
    });
  }
};
