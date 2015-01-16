module.exports = function(MetricEvent) {
  MetricEvent.aggregate = function(from, to, fields, cb) {
    fields = fields || ['endpoint', 'userId'];
    var filter = {
      where: {
        and: [
          { timestamp: { gte: from } },
          { timestamp: { lte: to } }
        ]
      },
      fields: fields,
      order: fields.map(function(f) { return f + ' ASC'; })
        .concat(['timestamp DESC'])
    };

    MetricEvent.find(filter, function(err, list) {
      if (err) return cb(err);

      var lastBucket;
      var result = [];

      list.forEach(function(item) {
        // TODO: handle time-based buckets (e.g. per minute)
        var bucketId = JSON.stringify(
          fields.map(function(f) { return item[f]; })
        );

        if (lastBucket && lastBucket.id === bucketId) {
          lastBucket.count++;
          return;
        }

        pushLastBucket();

        lastBucket = {
          id: bucketId,
          data: item,
          count: 1
        };
      });

      pushLastBucket();
      cb(null, result);

      function pushLastBucket() {
        if (!lastBucket) return;
        var item = { count: lastBucket.count };
        fields.forEach(function(f) {
          item[f] = lastBucket.data[f];
        });
        result.push(item);
      }
    });
  };

  MetricEvent.remoteMethod('aggregate', {
    accepts: [
      { arg: 'from', type: 'date', required: true },
      { arg: 'to', type: 'date', required: true },
      { arg: 'fields', type: '[string]' }
    ],
    returns: { arg: 'data', type: '[object]', root: true },
    http: { verb: 'GET' }
  });
};
