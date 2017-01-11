var expect = require('chai').expect;
var activityLog = require('../server/middleware/activity-log');
var loopback= require('loopback');
var supertest = require('supertest');

var ORG_ID = 'an-org-id';
var ENV_ID = 'an-env-id';

describe('Activity Log middleware', function() {
  var backendPort, eventsReported;
  before(createBackendStub);

  var app, request;
  before(createTestAppAndRequest);

  beforeEach(resetEnv);

  it('pushes events to the configured URL', function(done) {
    request.get('/api/products').expect(200, function(err) {
      if (err) return done(err);
      waitForBackend(function() {
        expect(eventsReported).to.have.length(1);
        done();
      });
    });
  });

  it('includes all expected fields', function(done) {
    request.get('/api/products').expect(200, function(err) {
      if (err) return done(err);
      waitForBackend(function() {
        expect(eventsReported).to.have.length(1);
        var event = eventsReported[0];

        // transactionId should be a UUID
        expect(event.transactionId, 'transactionId').to.match(/^[-\da-z]+/);
        delete event.transactionId;

        expect(event.datetime, 'datetime').to.be.a('string');
        expect(event.datetime, 'datetime').to.match(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/); // ISO Date string

        var ts = Date.parse(event.datetime);
        if (isNaN(ts)) {
          var msg = 'Timestamp ' + event.datetime + ' is not a valid date';
          throw new Error(msg);
        }
        expect(Date.now() - ts).to.be.lessThan(2000);
        delete event.datetime;

        expect(eventsReported[0]).to.eql({
          logPolicy: '',
          planId: '',
          requestHttpHeaders: [],
          responseHttpHeaders: [],
          requestBody: '',
          responseBody: '',
          apiUser: '',
          resourceId: '',
          apiId: '',
          statusCode: '200',
          queryString: [],
          uriPath: '/api/products',
          requestMethod: 'GET',
          envId: ENV_ID,
          orgId: ORG_ID,
          debug: [],
          source: '127.0.0.1',
          bytesSent: 0,
          bytesReceived: 0,
          remoteHost: '',
          userAgent: '',
          requestProtocol: 'http',
          apiVersion: ''
        });
        done();
      });
    });
  });

  it('parses query string', function(done) {
    var url = '/api/products?filter[where][name]=red%20pencil';
    request.get(url).expect(200, function(err) {
      if (err) return done(err);
      waitForBackend(function() {
        expect(eventsReported).to.have.length(1);
        var event = eventsReported[0];

        expect(event.uriPath, 'uriPath').to.equal('/api/products');
        expect(event.queryString, 'queryString').to.eql([
          { 'filter[where][name]': 'red pencil' }
        ]);
        done();
      });
    });
  });

  // Wait few moments to let the backend process API events
  function waitForBackend(next) {
    wait();
    function wait() {
      if (eventsReported.length)
        next();
      else
        setTimeout(wait, 10);
    }
  }

  function createBackendStub(done) {
    var app = loopback();
    app.use(loopback.bodyParser.text({ type: function() { return true; } }));

    app.post('/events/_bulk', function(req, res) {
      // Move out of express' try/catch block so that any errors
      // bubble up to mocha's global error handler
      process.nextTick(function() {
        var events = req.body.split('\n').filter(Boolean).map(JSON.parse);
        var header = events.shift();
        expect(header).to.eql({
          create: { _type: 'apievent', _index: ORG_ID }
        });
        eventsReported = eventsReported.concat(events);
        res.json({ ok: true });
      });
    });

    app.listen(0, function() {
      backendPort = this.address().port;
      done();
    });
  }

  function createTestAppAndRequest(done) {
    app = loopback();
    app.set('legacyExplorer', false);
    app.dataSource('db', { connector: 'memory' });
    var Product = loopback.createModel('Product');
    app.model(Product, { dataSource: 'db' });

    app.use('/api', activityLog({
      connection: {
        url: 'http://127.0.0.1:' + backendPort + '/events/_bulk',
      },
      orgId: ORG_ID,
      envId: ENV_ID,
    }));
    app.use('/api', loopback.rest());
    app.listen(0, '127.0.0.1', function() {
      var port = this.address().port;
      request = supertest('http://localhost:' + port);
      done();
    });
  }

  function resetEnv() {
    eventsReported = [];
  }
});

