# Developers Guide for StrongLoop API Gateway

> NOTE: The API Gateway has been moved to http://docs.strongloop.com/display/LGW/Developer%27s+Guide.  Please edit that document, NOT this one!

StrongLoop API Gateway is a LoopBack application that provides the necessary 
infrastructure to serve your APIs to client applications over the Internet. 
It includes the following key building blocks:

- oAuth 2.0 provider for authentication and authorization
- API rate limiting
- API metrics and analytics
- API proxying

Once the StrongLoop API Gateway is up and running, client applications can start
to interact with the gateway to access protected resources/APIs. The Developers 
Guide describes how client application developers write code to handle the 
user-facing elements of the API flow.

## oAuth 2.0

oAuth 2.0 is the key component of StrongLoop Gateway. It provides the 
necessary authentication and authorization infrastructure to protect your APIs. 

The oAuth 2.0 protocol defines a number of [roles](https://tools.ietf.org/html/rfc6749#section-1.1)
as the actors that participate in the authentication and authorization process. 
Please note we use `user` and `resource owner` interchangeably in this document.   

![oauth2-overview](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-overview.png)

As illustrated in the diagram above, the client applications interact with the 
oAuth 2.0 provider using access tokens. Application developers are responsible 
for implementing the following tasks.  
 
1. Get an access token
2. Use an access token
3. Refresh an access token (optional)

### Get an access token

Before a client application makes any API request to protected resources, it 
needs to request an access token from the oAuth 2.0 authorization server. There
are a few oAuth 2.0 grant types and each of them represents a flow to get 
access tokens using a different form of authorization by the resource owner to 
the client.

1. [Authorization Code](https://tools.ietf.org/html/rfc6749#section-4.1)
2. [Implicit](https://tools.ietf.org/html/rfc6749#section-4.2)
3. [Resource Owner Password Credentials](https://tools.ietf.org/html/rfc6749#section-4.3) 
4. [Client credentials](https://tools.ietf.org/html/rfc6749#section-4.4)

#### Authorization Code

The Authorization Code grant involves three steps from a developer's perspective:

![oauth2-authorization-code](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-authorization-code.png)

1. Obtain the authorization from the user

The client initiates the flow by directing the resource owner's user-agent 
(browser) to the authorization endpoint as follows:

```
https://localhost:3001/oauth/authorize
?client_id=123
&redirect_uri=https://localhost:3001/server-side-app.html
&response_type=code
&scope=demo
&state=123
```

Parameters from the query string:

- response_type: Must be `code`
- client_id: Identifier of the client application
- redirect_uri: Redirect uri to receive the authorization code 
- scope: One or more scopes requested
- state: An opaque value used by the client to maintain state between the 
request and callback.

The authorization server authenticates the user (via the browser) and 
establishes whether the user grants or denies the client's access request. The
result will be sent back to the client via the redirect URI.
        
2. Handle the callback for authorization code

The client application sets up the endpoint for the redirect URI to handle the
callback from oAuth 2.0 authorization server. If the user grants the permission,
an authorization code is generated and available from the `code` parameter.

```
HTTP/1.1 302 Moved Temporarily
Location: https://localhost:3001/server-side-app.html
?code=2orYXLcDb8xIel5XgYQ8lIRxUkE4wxRu
&state=123
```

Parameters:

- code: The authorization code 
- state: The same value as the `state` from step 1
 
If the response is an error, please refer to https://tools.ietf.org/html/rfc6749#section-4.1.2.1.
 
3. Exchange the authorization code for an access token

The client requests an access token from the authorization server's token 
endpoint by including the authorization code received in the previous step. 
When making the request, the client authenticates with the authorization server.  
The client includes the redirection URI used to obtain the authorization code 
for verification.

```
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded; charset=UTF-8 
Accept: */*
Host: localhost:3001
 
code=GONTJQzRopCh1FE6FTD7erNXqzWBKj54&
grant_type=authorization_code&
client_id=123&
client_secret=secret&
redirect_uri=https://localhost:3001/server-side-app.html 
```

Please note that `client_id:client_secret` can be passed in using the 
`Authorization` header. See https://tools.ietf.org/html/rfc6749#section-2.3.1.
 
If the access token request is valid and authorized, the authorization server 
issues an access token and optional refresh token. An example successful 
response: 

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"PwqmxVXTagWCcqVDf6krYylQodnFCyXp",
  "expires_in":1209600,
  "scope":"demo",
  "refresh_token":"TzBJbywATTlXPVh3UUoCcMJZYLaF654q",
  "token_type":"Bearer"
}
```

#### Implicit

![oauth2-implicit](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-implicit.png)

1. Obtain the user authorization

The client initiates the flow by directing the resource owner's user-agent to 
the authorization endpoint. 

```
https://localhost:3001/oauth/authorize
?client_id=123
&redirect_uri=https://localhost:3001/server-side-app.html
&response_type=token
&scope=demo
state=123
```

Parameters:

- response_type: Must be `token`
- client_id: Identifier of the client application
- redirect_uri: Redirect uri to receive the authorization code 
- scope: One or more scopes requested
- state: An opaque value used by the client to maintain state between the 
request and callback.

Please note no client secret is needed. It relies on the pre-registered redirect
URI to ensure that the access token is visible to a legitimate client.  

The authorization server authenticates the user via the browser and establishes 
whether the user grants or denies the client's access request. Assuming the 
user grants access, the authorization server redirects the browser back to the 
client using the redirection URI provided earlier. The redirection URI includes 
the access token in the URI fragment.

2. Handle the callback for access_token

The authorization server redirects the browser back to the client using the
redirection URI provided earlier.  The redirection URI includes the access token 
in the URI fragment.
 
```
HTTP/1.1 302 Moved Temporarily
Location: https://localhost:3001/client-side-app.html#
access_token=OACTVToPs0POwDZzBcQB2gGlKvmd6Xbh&
expires_in=1209600&
scope=demo&
token_type=Bearer&
state=123
```

Please note the browser follows the redirection instructions by making a request 
to the web-hosted client resource (which does not include the fragment).  The 
browser retains the fragment information locally.

3. Error handling

See https://tools.ietf.org/html/rfc6749#section-4.2.2.1

#### Resource Owner Password Credentials

![oauth2-resource-owner-password-credentials](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-resource-owner-password-credentials.png)


The user provides the client with its username and password. The client requests 
an access token from the authorization server's token endpoint by including the 
credentials received from the resource owner.  When making the request, the 
client authenticates with the authorization server.
        
```
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded; charset=UTF-8 
Accept: */*
Host: localhost:3001

grant_type=password
&client_id=123
&client_secret=secret
&username=bob
&password=secret
&scope=demo
```

Parameters:
- grant_type: Must be set to `password`
- username: User name or email
- password: Password
- scope: One or more scopes requested
- client_id: Identifier of the client 
- client_secret: Secret of the client

Alternatively, the client authentication can be done over HTTP basic auth using
the `Authorization` header.

Please note the user credentials are visible to the client application. The 
resource owner must have a trust relationship with the client. 

The authorization server authenticates the client and validates the user 
credentials, and if valid, issues an access token.

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"zODJ1SdtOOUkhQbJTwo32qB2x6xpMlzw",
  "expires_in":1209600,
  "scope":"demo",
  "refresh_token":"bw4uaNPwRYLLVGjHhu87glPQlNEZnQJi",
  "token_type":"Bearer"
}
```

#### Client Credentials

![oauth2-client-credentials](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-client-credentials.png)

The client authenticates with the authorization server and requests an access 
token from the token endpoint.

```
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded; charset=UTF-8 
Accept: */*
Host: localhost:3001

grant_type=client_credentials
&client_id=123
&client_secret=secret
&scope=demo
```

Parameters:
- grant_type: Must be set to `client_credentials`
- scope: One or more scopes requested
- client_id: Identifier of the client 
- client_secret: Secret of the client

Alternatively, the client authentication can be done over HTTP basic auth using
the `Authorization` header.

The authorization server authenticates the client, and if valid, issues an 
access token.

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"FkzdyJV14zc73AaK9FmNCtyp5bUTegis",
  "expires_in":1209600,
  "scope":"demo",
  "refresh_token":"k5ikqVDBvYWtTjjxDBzdrNicry9VkPu7",
  "token_type":"Bearer"
}
```

Please note the client credentials grant doesn't involve a user. As a result,
the access token is not associated with a resource owner.

#### Refresh token

![oauth2-refresh-token](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-refresh-token.png)

If the authorization server issued a refresh token to the client, the client 
can make a refresh request to the token endpoint as follows:
   
```
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded; charset=UTF-8 
Accept: */*
Host: localhost:3001

grant_type=refresh_token
&refresh_token=k5ikqVDBvYWtTjjxDBzdrNicry9VkPu7
&client_id=123
&client_secret=secret
&scope=demo
```

Parameters:
- grant_type: Must be set to `refresh_token`
- refresh_token: The refresh token issued to the client
- scope: One or more scopes requested. The requested scope MUST NOT include 
any scope not originally granted by the user, and if omitted is
treated as equal to the scope originally granted by the user.
- client_id: Identifier of the client 
- client_secret: Secret of the client

Alternatively, the client authentication can be done over HTTP basic auth using
the `Authorization` header.

The authorization server authenticates the client, validates the refresh token, 
and if valid, issues an access token with an optional refresh token.

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"FkzdyJV14zc73AaK9FmNCtyp5bUTegis",
  "expires_in":1209600,
  "scope":"demo",
  "refresh_token":"k5ikqVDBvYWtTjjxDBzdrNicry9VkPu7",
  "token_type":"Bearer"
}
```

#### Client authentication with JWT

![oauth2-jwt-client-authentication](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-jwt-client-authentication.png)

https://tools.ietf.org/html/draft-ietf-oauth-jwt-bearer-12

1. Create a JWT assertion

```
var jwt = require('jws');

// Load the SSL credentials
var sslCerts = require('./../private/ssl_cert');

// Construct the claim
var payload = {
  iss: '123', // issuer - client id
  sub: 'bob', // subject - the resource owner username/email
  aud: '/oauth/token', // audience
  exp: Date.now() + 10000, // expiration time
  iat: Date.now(), // issued at time
  scope: ['demo'] // a list of oAuth 2.0 scopes
};

var body = {
  header: { alg: 'RS256' },
  privateKey: sslCerts.privateKey,
  payload: payload
};

// Create a JWT assertion
var assertion = jwt.sign(body);
```

2. Exchange the JWT assertion for an access token

```
var form = {
  grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  assertion: assertion
};

var request = require('request');
request.post({
  url: 'https://localhost:3001/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  strictSSL: false,
  form: form
}, function(err, res, body) {
  console.log(err, body); 
});

```

The resource owner (*bob*) needs to pre-authorize the client application with
required scopes.

Error:

{"error":"server_error","error_description":"Permission denied by bob"}


{
  "access_token":"sbjOD5qdoxpauThYCemvXBmxBPI1apXt",
  "expires_in":1209600,
  "scope":"demo",
  "token_type":"bearer"
}


#### Authorization code grant with JWT 

![oauth2-jwt-authorization-grant](https://github.com/strongloop/strong-gateway/raw/master/docs/oauth2-jwt-authorization-grant.png)

1. Sign the JWT assertion

```
var jwt = require('jws');
var sslCerts = require('./../private/ssl_cert');

var payload = {
  iss: '123',
  sub: '123', // client id
  aud: '/oauth/token',
  exp: Date.now() + 10000,
  iat: Date.now(),
  scope: ['demo']
};

var body = {
  header: { alg: 'RS256' },
  privateKey: sslCerts.privateKey,
  payload: payload
};

var assertion = jwt.sign(body);
```

2. Exchange the authorization code for an access token using JWT client assertion

```
var form = {
  grant_type: 'authorization_code',
  code: code,
  client_assertion_type:
    'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: assertion
};

var request = require('request');
request.post({
  url: 'https://localhost:3001/oauth/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  strictSSL: false,
  form: form
}, function(err, res, body) {
  console.log(err, body);
});
```

### Token types

Three types of token are supported based on the client application's tokenType
setting:

- Bearer
- JWT
- MAC

#### Support for MAC token

Client applications can choose to use [MAC tokens](https://tools.ietf.org/html/draft-ietf-oauth-v2-http-mac-05)
by setting the `tokenType` property to `MAC` during registration.

Response from the authorization server for a MAC token will look like:

```
HTTP/1.1 200 OK
     Content-Type: application/json
     Cache-Control: no-store

     {
       "access_token":
   "eyJhbGciOiJSU0ExXzUiLCJlbmMiOiJBMTI4Q0JDK0hTMjU2In0.
   pwaFh7yJPivLjjPkzC-GeAyHuy7AinGcS51AZ7TXnwkC80Ow1aW47kcT_UV54ubo
   nONbeArwOVuR7shveXnwPmucwrk_3OCcHrCbE1HR-Jfme2mF_WR3zUMcwqmU0RlH
   kwx9txo_sKRasjlXc8RYP-evLCmT1XRXKjtY5l44Gnh0A84hGvVfMxMfCWXh38hi
   2h8JMjQHGQ3mivVui5lbf-zzb3qXXxNO1ZYoWgs5tP1-T54QYc9Bi9wodFPWNPKB
   kY-BgewG-Vmc59JqFeprk1O08qhKQeOGCWc0WPC_n_LIpGWH6spRm7KGuYdgDMkQ
   bd4uuB0uPPLx_euVCdrVrA.
   AxY8DCtDaGlsbGljb3RoZQ.
   7MI2lRCaoyYx1HclVXkr8DhmDoikTmOp3IdEmm4qgBThFkqFqOs3ivXLJTku4M0f
   laMAbGG_X6K8_B-0E-7ak-Olm_-_V03oBUUGTAc-F0A.
   OwWNxnC-BMEie-GkFHzVWiNiaV3zUHf6fCOGTwbRckU",
       "token_type":"mac",
       "expires_in":3600,
       "refresh_token":"8xLOxBtZp8",
       "kid":"22BIjxU93h/IgwEb4zCRu5WF37s=",
       "mac_key":"adijq39jdlaska9asud",
       "mac_algorithm":"hmac-sha-256"
     }
```

To access protected resources using MAC, the client need to sign the request as
follows:

```js
/* Assume the token object is:
{
   access_token: 'eyJhbGciOiJSU0ExXzUiLCJlbmMiOiJBMTI4Q0JDK0hTMjU2In0.
                     pwaFh7yJPivLjjPkzC-GeAyHuy7AinGcS51AZ7TXnwkC80Ow1aW47kcT_UV54ubo
                     nONbeArwOVuR7shveXnwPmucwrk_3OCcHrCbE1HR-Jfme2mF_WR3zUMcwqmU0RlH
                     kwx9txo_sKRasjlXc8RYP-evLCmT1XRXKjtY5l44Gnh0A84hGvVfMxMfCWXh38hi
                     2h8JMjQHGQ3mivVui5lbf-zzb3qXXxNO1ZYoWgs5tP1-T54QYc9Bi9wodFPWNPKB
                     kY-BgewG-Vmc59JqFeprk1O08qhKQeOGCWc0WPC_n_LIpGWH6spRm7KGuYdgDMkQ
                     bd4uuB0uPPLx_euVCdrVrA.
                     AxY8DCtDaGlsbGljb3RoZQ.
                     7MI2lRCaoyYx1HclVXkr8DhmDoikTmOp3IdEmm4qgBThFkqFqOs3ivXLJTku4M0f
                     laMAbGG_X6K8_B-0E-7ak-Olm_-_V03oBUUGTAc-F0A.
                     OwWNxnC-BMEie-GkFHzVWiNiaV3zUHf6fCOGTwbRckU',
   kid: '22BIjxU93h/IgwEb4zCRu5WF37s=',
   ts: 1429561690760, // timestamp,
   mac_algorithm: 'hmac-sha-256',
   mac_key: 'adijq39jdlaska9asud'
}
*/
var crypto = require('crypto');
var algorithms = {
  'hmac-sha-1': 'sha1',
  'hmac-sha-256': 'sha256'
};

function setupMacAuth(token, verb, host, path) {
  var params = {
    access_token: token.access_token,
    kid: token.kid,
    ts: ts || Date.now(),
    h: 'host'
  };

  var req = verb.toUpperCase() + ' ' + path + ' HTTP/1.1';
  var host = host || 'localhost:3001';
  var text = [req, params.ts, host].join('\n');

  var mac = crypto.createHmac(algorithms[token.mac_algorithm], token.mac_key)
    .update(text).digest('base64');

  params.mac = mac;
  var fields = [];
  for (var p in params) {
    fields.push(p + '="' + params[p] + '"');
  }

  var authorizationHeader = 'MAC ' + fields.join(',');
  return authorizationHeader;
}  

var auth = setupMacAuth(token, 'GET', 'localhost:3001', '/test');
// Send the http request with the authorization header
request({url: 'https://localhost:3001/test', headers: {authorization: auth}},
  function(err, res, body) {
   // Handle the HTTP res
  });
```

### Use an access token

The client accesses protected resources by presenting the access token to the 
resource server. Depending on the token type, the client can use the HTTP 
`Authorization` header or `access_token` query parameter.

For example,


```
GET /protected/protected-apis.html HTTP/1.1
Host: localhost:3001
Authorization: Bearer cdtXRlBcXBSWrdc6vZbCFGiq3ZUhl0BF
```

or 

```
GET /protected/protected-apis.html?access_token=cdtXRlBcXBSWrdc6vZbCFGiq3ZUhl0BF HTTP/1.1
Host: localhost:3001
```

### Validate an access token

The resource server MUST validate the access token and ensure that it has not 
expired and that its scope covers the requested resource. StrongLoop Gateway
performs the following checks:

1. The access token exists in the database for access tokens 
2. The access token has not expired
3. The client application associated with the access token is still valid
4. The user associated with the access token is still valid
5. The scopes of the access token are sufficient for the protected resource


