# Route based ACLs

The purpose of this document is to illustrate the architecture of a route based
ACL solution for the [StrongLoop API Gateway](https://strongloop.com/node-js/api-gateway/).

## Overview

In order to access a resource protected by an authorization server (auth
server), a client is required to provide valid credentials with each request.
The credentials is an access token which is used by the auth server to determine
the matching `userid` and `clientid` for the request. The typical flow
goes something like:

```
   /api/notes/bounce?access_token=abcdef
                     |           (2) (3)
+--------+           |      +---------------+                  +----------+
| Client |-----------+-(1)->| Authorization |--{userid:1}-(4)->| Resource |
|        |<-(6)-[notes]-----| Server        |<-(5)-[notes]-----| Server   |
+--------+                  +---------------+                  +----------+
(Web Server)                (Gateway Server)                   (API Server)
```

1. A client makes a request to the auth server in order to access a protected
resource.
2. The auth server uses the access token provided in the request to find a
matching a `userid`/`clientid`
3. The auth server determines whether the client has sufficient rights to access the protected resource based on the [rules set in `middleware.json`](../server/middleware.json#L53).
4. The auth server proxies the request to the resource server if the client has sufficient
rights
5. The resource server returns the resource to the auth server
6. The auth server forwards the requested resource back to the client

To create a route based ACL solution that follows this design, you will need to:

1. [Create the `routes-acl` middleware](#1-create-the-routes-acl-middleware)
2. [Register the middleware](#2-register-the-middleware)
3. [Define rules for middleware](#3-define-rules-for-the-middleware)

## 1. Create the `routes-acl` middleware

Create [`routes-acl.js`](../server/middleware/routes-acl.js) in the [`server/middleware` dir](../server/middleware).

>You will need to implement your own [ACL logic](#the-acl-logic) to determine if
the request has sufficient rights to access the resource.

### Key values for the ACL Logic

The middleware handler function provides a [`req` object](../server/middleware/routes-acl.js#L4)
containing three values you will need to use in your allow/deny request logic:

Key|Description
:-:|:--
`req.headers`|The request headers
`req.accessToken`|The `access_token` value from the request query string parameter
`req.url`|The resource being requested

In addition, the `req.accessToken` also contains the `userid`, `clientid`, and
`scopes` keys:

```
{
  userid: 1,
  clientid: 1,
  scopes: ['notes', 'admin']
}
```

By using a combination of all these values, you will be able to determine if the
client has sufficient authorization to proceed.

### The ACL logic

Before implementing the [`routes-acl` middleware ACL logic](../server/middleware/routes-acl.js#L9),
there are some important points to note:

- The `userid`/`clientid` is used to identify who is accessing the resource
- The `userid`/`clientid` is preestablished by the resource server
- The scope determines which resources on the resource server are available to
  the client
- ACLs determine whether the `userid`/`clientid` is allowed to access the
resource
  - Even if the client has access to the scope, it doesn't necessarily mean the
    client is allowed to access the resource (the ACL determines this)

Term|Abstraction
:-:|:--
Scope|What you're trying to do
Role|Who you are
ACL|The decision to allow/deny a resource

With the access token (and its [values](#key-values-for-the-acl-logic), you have
enough information to grant or deny access based on a set of rules you create.
The logic will involve:

1. [Determine the client role](#1-determine-the-client role)
2. [Verify scope permission](#2-verify-scope-permissions)
3. [Verify ACL permissions](#3-verify-acl-permissions)

####1. Determine the client role

Use the provided `userid`/`clientid` in the access token to identify the
requester.

####2. Verify scope permissions

Compare the rules you set in `middleware.json` to determine if the client is
allowed to access the scope they are requesting. You can find the scopes the
client is requesting in the `req.accessToken.scopes` value.

####3. Verify ACL permissions

Compare the ACL rules in `middleware.json` to determine if the client has
permissions to access the resource. You will need to use the `req.url` value to
determine the resource is being requested.

### Pseudocode

The following is an example of where you could add the logic. Of course, the
actual implementation will ultimately be up to you, but the following is just
here to give you a general idea and starting point.

#### `middleware.json`

```
...
"auth:after": {
  "./middleware/routes-acl": {
    "params": {
      // your scope rules
      // your role rules
      // your acl rules
    }
  }
}
...
```

#### `routes-acl.js`

```
module.exports = function(options) {
  options = options || {};

  return function checkRouteAcls(req, res, next) {
    // use `req.accessToken.clientid` or `req.accessToken.userid` to determine the role
    // check the determined role against the role rules you set in `middleware.json`
    // check `req.accessToken.scopes` against the scope rules you set in `middleware.json` to ensure the client has access to the scope
    // check the `req.url` against the ACL rules you set in `middleware.json` to determine the client is allowed to access the requested resource

    // insufficient credentials?
      // deny request and return 401
    // sufficent credentials?
      // allow the request to go through, gateway will then continue down the
      // middleware stack and proxy the request to the resource server, etc.

    next();
  };
};
```

>See ["Defining a new middleware handler function"](http://docs.strongloop.com/display/public/LB/Defining+middleware;jsessionid=E4D7BC956D7C923C8378519EF8768BF4#Definingmiddleware-Defininganewmiddlewarehandlerfunction).

## 2. Register the middleware

[Add an `auth:after` section to `middleware.json`](../server/middleware.json#L50-L56).

## 3. Define rules for the middleware

In the [`params` section of the `routes-acl` middleware](../server/middleware.json#L53),
create declarative rules that will be used by the [`routes-acl` middleware logic](../server/middleware/routes-acl.js#L9)
to allow or deny access to the requested resource.
