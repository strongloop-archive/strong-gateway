# Administrators Guide for StrongLoop API Gateway

## Overview

StrongLoop API gateway is a LoopBack application that provides the necessary 
infrastructure to serve your APIs to client applications over the Internet. 
It includes:

- oAuth 2.0 provider for authentication and authorization
- API rate limiting
- API metrics and analytics
- API proxying

The key building blocks are illustrated below in the diagram.

![gateway-building-blocks](gateway-building-blocks.png)

## Typical Flow of an API request

1. The client application requests an access token from the oAuth 2.0 
authorization server.
2. The client application sends an API request with the access token to the 
oAuth 2.0 resource server.
3. The resource server validates the access token (including expiration, scope, 
client id and resource owner) to either allow or deny the access. If deny, an 
error response is sent to the client application and the flow terminates.
4. The metrics middleware captures the API usage and updates the metrics.
5. The rate limiting middleware introspects the API request and check the rate 
limits based on various keys. If it exceeds one of the limits, , an error 
response is sent to the client application and the flow terminates.
6. The proxy middleware looks up the routing configuration to decide if the 
request should be handled locally or forwarded to a remote API server.
7. The API server processes the request and produces a response.
8. The response is received by the proxy middleware, and then sent back to the 
original client application. 

## Understand oAuth 2.0

https://tools.ietf.org/html/rfc6749 

![oauth2-infrastructure](oauth2-infrastructure.png)

### oAuth 2.0 roles

#### Resource Owner

“An entity capable of granting access to a protected resource. When the 
resource owner is a person, it is referred to as an end-user.”

In LoopBack, we also refer to ‘Resource Owner’ as ‘User’. It’s backed by the 
User model or a sub-model of User.

#### Client

“An application making protected resource requests on behalf of the resource 
owner and with its authorization.  The term "client" does not imply any 
particular implementation characteristics (e.g., whether the application 
executes on a server, a desktop, or other devices).”

In LoopBack, we also refer to ‘Client’ as ‘Application’. It’s backed by the 
Application model or a sub-model of Application.

#### Authorization Server

The server issuing access tokens to the client after successfully authenticating 
the resource owner and obtaining authorization.

- Authorization endpoint: used by the client to obtain authorization from the 
resource owner via user-agent redirection.
- Token endpoint: used by the client to exchange an authorization grant for an 
access token, typically with client authentication
- Decision endpoint
- Login endpoint

#### Resource Server

- Configure the middleware
- Configure scopes

### Metadata Models

- User
- OAuthClientApplication (extends Application)
- OAuthAccessToken
- OAuthAuthorizationCode
- OAuthPermission

![oauth2-metadata-models](oauth2-metadata-models.png)


### Client Registration

https://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-24 

- In LoopBack, the client registration is achieved by creating an instance of 
Application model. An ‘client-id’ and ‘client-secret’ will be generated to 
authenticate the client.
- Each application can be configured to constrain its permissions to request 
certain oAuth 2.0 flows.

#### Supported Grant Types

LoopBack allows an application to request access tokens via one of the following 
grant types:

- implicit
- authorization_code
- client_credentials
- password
- urn:ietf:params:oauth:grant-type:jwt-bearer

#### Supported Response Types

LoopBack allows an application to use the authorization server with one of the 
following response types:

- token: implicit grant type
- code: authorization code grant type

#### Supported Token Types

LoopBack allows a client application to request access tokens of one of the 
following types:

- Bearer
- JWT
- MAC

#### Scopes

Access token scope represents a collection of protected resources to be accessed. 

#### Redirect URIs


### Understand JWT

### Understand MAC

https://tools.ietf.org/html/draft-ietf-oauth-v2-http-mac-05


### Pre-authorized permissions

(userId, appId, scopes)


## Provision oAuth 2.0 servers

Provision an oAuth 2.0 provider

server/component-config.json

```json
{
  "loopback-component-oauth2": {
    "dataSource": "db",
    "loginPage": "/login",
    "loginPath": "/login”,
    "authorizationServer": true,
    "resourceServer": true
  }
}
```

- authorization server
- resource server


## Enforcing HTTPS

server/middleware.json

```json
 "routes:before": {
    "./middleware/https-redirect": {
      "params": {
        "httpsPort": 3001
      }
    },
```

### Enable API Metrics

server/middleware.json

```json
 "initial": {
    …
    "../strong-metrics/middleware/report-metrics": {
    }
  },
```  

### Enforece Rate Limiting

server/middleware.json

```json
"routes:after": {
    "./middleware/rate-limiting-policy": {
      "paths": ["/api", "/protected"],
      "params": {
        "limit": 100,  "interval": 60000,
        "keys": {
          "app": {"template": "app-${app.id}”, "limit": 1000},
          "ip": 500,
          "url": {"template": "url-${urlPaths[0]}/${urlPaths[1]}”, "limit": 1000},
          "user": {"template": "user-${user.id}”, "limit": 1000},
          "app,user": {"template": "app-${app.id}-user-${user.id}”, "limit": 1000}
        }}},
```

#### Configuration Properties

- limit
- interval
- keys (per key based limiting)
  - app
  - ip
  - url
  - user
  - app,user

### Reverse Proxy

server/middleware.json

```json
"routes:after": {
  "./middleware/proxy": {
      "params": {
        "rules": [
          "^/api/(.*)$ http://localhost:3002/api/$1 [P]"
        ]
      }
    }
}
```

#### Configuration
The “rules” is an array of rewrite rules. Each rewrite rule is a string with 
the syntax: `MATCHING_PATHS REPLACE_WITH [FLAGS]`. `MATCHING_PATHS` should be 
defined using a regex string. `REPLACE_WITH` is the replacement string for 
matching paths. Flags is optional and is defined using hard brackets. 
For proxies, the flag should be [P].

Use parenthesized submatch string as a parameter

See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
For example, the rule `"^/blog/(.*) /$1"` will replace `"/blog/xyz"` 
with `"/blog/xyz"` as `"xyz"` is the submatch for `(.*)`.
