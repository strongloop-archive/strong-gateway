module.exports = function(options) {
  options = options || {};

  return function checkRouteAcls(req, res, next) {
    console.log('Headers:', req.headers);
    console.log('Access Token:', req.accessToken);
    console.log('Request URL:', req.url);

    // your logic here

    next();
  };
};
