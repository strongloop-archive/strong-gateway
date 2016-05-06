// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

/**
 * Module dependencies.
 */

exports.loginForm = function(req, res) {
  var demoUser;
  if (process.env.NODE_ENV !== 'prod' &&
      process.env.NODE_ENV !== 'production') {
    demoUser = {
      username: 'bob',
      password: 'secret'
    };
  }
  res.render('login', {demoUser: demoUser});
};

exports.callbackPage = function(req, res) {
  res.render('callback');
};
