# loopback-example-gateway

`loopback-example-gateway` is a LoopBack example application to demonstrate how
 to build an API gateway using LoopBack.

## What is an API gateway

https://docs.google.com/document/d/1HnoUy8E1OVvk8mGD9cbpCNGbF1TuXINXcweXA15n8BA/edit?usp=sharing

## The basic features

In this tutorial, we'll build a simplified version of API gateway using LoopBack.
The gateway supports the following basic features:

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



### oAuth 2.0

#### Set up authorization server
#### Set up resource server

### Rate Limiting

#### Token bucket

### Proxy

#### Routing

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



