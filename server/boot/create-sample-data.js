// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

module.exports = function(app, cb) {
  if (process.env.NODE_ENV !== 'prod' &&
    process.env.NODE_ENV !== 'production') {
    require('../scripts/create-sample-data')(app, cb);
  }
};
