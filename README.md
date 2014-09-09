# loopback-example-gateway

LoopBack Example for the API gateway

## oAuth 2.0

## Rate Limiting

## Proxy

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


