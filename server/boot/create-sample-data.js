module.exports = function(app, cb) {
  if (process.env.NODE_ENV !== 'prod' &&
    process.env.NODE_ENV !== 'production') {
    require('../scripts/create-sample-data')(app, cb);
  }
};
