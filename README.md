# loopback-example-gateway

`loopback-example-gateway` is a LoopBack example application to demonstrate how
 to build an API gateway using LoopBack.

## What is an API gateway

https://docs.google.com/document/d/1HnoUy8E1OVvk8mGD9cbpCNGbF1TuXINXcweXA15n8BA/edit?usp=sharing

## The basic features

In this tutorial, we'll build a simplified version of API gateway using LoopBack.
The gateway supports the following basic features:

- HTTPS
- oAuth 2.0 based authentication & authorization
- Rate limiting
- Reverse proxy

The test scenario consists of three components:
 
- A client application that invokes REST APIs
- A loopback application (api gateway) that bridges the client application and 
the backend api 
- A loopback application (api server) serving the REST APIs 
 
The architecture is illustrated in the diagram below.

![loopback-api-gateway](loopback-api-gateway.png)

## Build the application

The application was initially scaffolded using `slc loopback` command.

### HTTPS

[oAuth 2.0](http://tools.ietf.org/html/rfc6749#section-10.9) states that the 
authorization server MUST require the use of TLS with server authentication for
any request sent to the authorization and token endpoints.

There are two steps involved:

1. Create the https server for the application

See https://github.com/strongloop/loopback-example-ssl for more details.

2. Redirect incoming http requests to the https urls

./lib/middleware/https-redirect

```js
var httpsRedirect = require('./middleware/https-redirect');
...
// Redirect http requests to https
var httpsPort = app.get('https-port');
app.use(httpsRedirect({httpsPort: httpsPort}));
```

### oAuth 2.0

The oAuth 2.0 integration is done using [loopback-component-oauth2](https://github.com/strongloop/loopback-component-oauth2).

In our case, we configure the API gateway as both an authorization server and 
resource server.

#### Set up authorization server

```js
var oauth2 = require('loopback-component-oauth2').oAuth2Provider(
  app, {
    dataSource: app.dataSources.db, // Data source for oAuth2 metadata persistence
    loginPage: '/login', // The login page url
    loginPath: '/login' // The login processing url
  });
```

#### Set up resource server

```js
oauth2.authenticate(['/protected', '/api', '/me'], {session: false, scope: 'demo'});
```

### Rate Limiting

Rate limiting controls how many API calls can be made from client applications 
within a certain period of time.

- keys
- limit
- interval

```js
var rateLimiting = require('./middleware/rate-limiting');
app.use(rateLimiting({limit: 100, interval: 60000}));
```

### Proxy

```js
var proxy = require('./middleware/proxy');
var proxyOptions = require('./middleware/proxy/config.json');
app.use(proxy(proxyOptions));
```

```json
{
  "rules": [
    "^/api/(.*)$ http://localhost:3002/api/$1 [P]"
  ]
}
```

## Run the app

### Create the api server

```sh
slc loopback
cd demo-api-server
slc loopback:model
```

### Run the api server

```sh
PORT=3002 node .
```

### Run the gateway

```sh
node .
```

Open a browser and point it to https://localhost:3001/index.html

![home](home.png)

![login](login.png)

![decision](decision.png)

![notes](notes.png)


