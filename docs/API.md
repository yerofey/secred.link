# API

In case you'll want to run the app locally - you can use your own API.
You just need these methods.

## Create secret

### Frontend POST Request

Path: `/secret/create`

Method: `POST`

```js
{
 "accessKey": "41c80e9ed6d1a3a41128a99a3c02749f0cbb9dc80902bac0a7aeb08b66591248", // string: 64 symbols
 "manageKey": "9b2959b7d3b2e684dde08960b1192a565f5823bde4bb1946f0043c2855bf83de", // string: 64 symbols
 "contentHash": "53616c7465645f5f548a620e4dda0eb3fc25b42519f1b4cd3d7b5f8cf373e9e7",
 "testHash": "53616c7465645f5f4443560ed15a0b34a384d7eb387e8ae71e9d92001e86891c", // string: 64 symbols
 "isProtected": false, // boolean
 "isBurnable": false, // boolean
 "lifetime": 2592000, // int
 "v": 0, // int
}
```

### Backend Creation Response Body

```js
{
 "data": {
  "success": true
 }
}
```

## Get secret

### Frontend GET Request

Path: `/secret/get/{accessKey}`

Method: `GET`

### Backend Data Response Body

```js
{
 "data": {
  "content": "53616c7465645f5f0a8c9dd4571f411b3fe8002ca375676475b39987b3b90cfb",
  "test": "53616c7465645f5feb63c8f1f7446d389e4b566cce12cc21082e610945336a36",
  "isProtected": false,
  "isBurnable": false,
  "expiration_date": "2023-02-11T19:35:09.000000Z",
  "creation_date": "2023-01-12T19:35:09.000000Z",
  "v": 0
 }
}
```
