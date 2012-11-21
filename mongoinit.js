/**
 * Module dependencies.
 */
var mongoose = require('mongoose'), 
    config = require('./config/config.js')

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() {
  console.log('MongoDB connection opened');
});

// bootstrap mongoose connection
var mongo = {};
// if running in appfog
if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
  mongo = env['mongodb-1.8'][0]['credentials'];
} else {
  mongo = config.creds.mongo;
}

var generate_mongo_url = function(obj) {
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'node-api-platform_development');
  if (obj.username && obj.password) {
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  } else {
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}

var mongourl = generate_mongo_url(mongo);

if(mongoose.connection.readyState  == 0) {
  exports.db = mongoose.connect(mongourl);
}

exports.mongourl = mongourl;
