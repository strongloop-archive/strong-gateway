module.exports = function(app, cb) {
  if (app.dataSources.db) {
    console.log('Autoupdating database: %j', app.dataSources.db.settings);
    app.dataSources.db.autoupdate(cb);
  } else {
    process.nextTick(cb);
  }
};