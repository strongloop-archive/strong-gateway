# loopback-example-gateway

`loopback-example-gateway` is a LoopBack example application to demonstrate how
 to build an API gateway using LoopBack.

## What is an API gateway

https://docs.google.com/document/d/1HnoUy8E1OVvk8mGD9cbpCNGbF1TuXINXcweXA15n8BA/edit?usp=sharing

## The basic features

- oAuth 2.0 based authentication & authorization
- Rate limiting
- Reverse proxy

### oAuth 2.0

### Rate Limiting

### Proxy

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



