/**
 * Module dependencies.
 */
var passport = require('passport')
  , login = require('connect-ensure-login');


exports.index = function(req, res, next) {
  if(req.path !== "/login") {
    if(req.path === "/") {
        login.ensureLoggedIn({redirectTo: '/home'})(req, res, next);
    } else {
        login.ensureLoggedIn()(req, res, next);
    }
  } else {
    next();
  }
};

exports.home = function(req, res) {
    var params = {};
    if(req.user && req.user.name) {
        params.actionURI = "/account";
        params.actionName = "My Account -  " + req.user.name;
    } else {
        params.actionURI = "/login";
        params.actionName = "Login";
    }
    res.render('home', params);
};

exports.loginForm = function(req, res) {
  res.render('login');
};

exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/home', failureRedirect: '/login' });

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/home');
};

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render('account', { user: req.user });
  }
];

exports.callbackPage = function(req, res) {
  res.render('callback');
};
