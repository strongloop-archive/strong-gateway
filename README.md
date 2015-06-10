# strong-gateway

The StrongLoop API Gateway, `strong-gateway`, enables you to  externalize,
secure, and manage APIs.  The API gateway is an intermediary between API consumers (clients) and API servers.

See:
- [StrongLoop API Gateway](http://docs.strongloop.com/display/LGW) for detailed documentation.
- [strong-gateway-demo](https://github.com/strongloop/strong-gateway-demo) for an example.

## Basic features

The StrongLoop API Gateway's features include:

- **HTTPS**: Ensure all communication is done securely via HTTPS.
- **OAuth 2.0 authentication and authorization**: Authenticate client
applications and authorize them to access protected endpoints with approval from
resource owners.
- **Rate limiting**: control how many requests can be made within a given time
period for identified api consumers.
- **Reverse proxy**: forward the requests to the server that hosts the api endpoint

## License

The module is licensed under [StrongLoop Subscription Agreement](https://strongloop.com/license/).

Please run `slc arc --licenses` and log in with your strongloop.com user to
check if you have a valid license to use StrongLoop API Gateway. All new users
will get a 30 day trial license for `gateway` automatically.
