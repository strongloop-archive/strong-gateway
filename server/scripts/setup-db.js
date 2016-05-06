// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

// Set the env to prod to avoid sample-data population
process.env.NODE_ENV= 'prod';
var app = require('../server');

if (app.dataSources.db) {
  console.log('Auto-updating database: %j', app.dataSources.db.settings);
  app.dataSources.db.autoupdate(function(err) {
    if(err) {
      console.error('Error in setting database: %j', err);
    }
    console.log('Database is set up');
    app.dataSources.db.disconnect();
  });
}
