MongoDB backed oAuth 2.0 server
==============================

The oAuth 2.0 server is built on top of [oauth2orize](https://github.com/jaredhanson/oauth2orize).

There are a few enhancements:

* Use Mongoose/MongoDB as the backend to store oAuth 2.0 metadata, such as:
  * tokens
  * authorization codes
  * client registrations
  * users
  * scopes (TBD)
  * protected resources (TBD)
* Upgrade to Express 3.0.x
* HTTPS support

How to run the server?
======================

1. Start a local mongodb instance
<pre>
mongod --dbpath=mongodb-2.2-demo/ &
</pre>

2. Run the server
<pre>
node app
</pre>

Please note it will create the dummy user: bob/secret and dummy client: abc123/ssh-secret.

Now the you can start to explore oAuth 2.0 authorization and token endpoints at:

<http://localhost:9080/dialog/authorize>
<http://localhost:9080/token>

or 
<https://localhost:9443/dialog/authorize>
<https://localhost:9443/token>


Customize the configurations
============================

## Generate your own SSL certificate

<pre>
cd private	
openssl genrsa -out privatekey.pem 1024 
openssl req -new -key privatekey.pem -out certrequest.csr 
openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem	
</pre>

## Configure the MongoDB connection
Update db/mongodb_config.js
<pre>
	exports.creds = {
	    // Your mongo auth uri goes here
	    // e.g. mongodb://username:server@mongoserver:10059/somecollection
	    mongoose_auth : 'mongodb://localhost:27017/oauth2'
	}
</pre>	
