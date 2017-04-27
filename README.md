> Our new gateway product is available at https://github.com/strongloop/microgateway.

# Deprecation notice | March 22, 2016

After IBM’s acquisition of StrongLoop, we have integrated `strong-gateway` with
the latest product offering from IBM called **API Connect**. IBM API Connect is
a complete solution that addresses all aspects of the API lifecycle, for both
on-premises and cloud environments. It offers comprehensive capabilities to
create, run, manage, secure and monetize APIs and microservices. Delivering an
unparalleled, integrated user experience, it enables rapid deployment and
simplified administration of APIs.

The new `apiconnect-microgateway` is the enforcement secure component of API
Connect. It is fundamentally a proxy, securing and forwarding requests to
backend APIs. API Connect Micro Gateway was created using StrongLoop technology
and a series of middleware components. The package is customized to work with
the API Connect infrastructure that automatically communicates with the micro
gateway to dynamically load APIs, Products, and Plans so that APIs are secured
and processed in a seamless fashion.

Learn more about API Connect at https://developer.ibm.com/apiconnect/.

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
check if you have a valid license to use StrongLoop API Gateway.

