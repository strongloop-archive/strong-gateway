/**
 * Module dependencies.
 */
var passport = require('passport')
  , login = require('connect-ensure-login')


exports.index = function(req, res, next) {
  console.log("Path:" + req.path);
  if(req.path !== "/login") {
    login.ensureLoggedIn()(req, res, next);
  } else {
    next();
  }
}


exports.loginForm = function(req, res) {
  res.render('login');
};

exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' });

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
}

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render('account', { user: req.user });
  }
]

exports.callbackPage = function(req, res) {
  res.render('callback');
};
