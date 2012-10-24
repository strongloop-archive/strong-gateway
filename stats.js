var instrument = require('node-statsd-instrument');

statsdClient = new instrument.StatsD('localhost', 8125);
statsdInstrument = new instrument.StatsDInstrumentation(statsdClient);

exports.instrument = statsdInstrument;

