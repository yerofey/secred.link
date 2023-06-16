# API

In case you'll want to run the app locally - you can use your own API.
You just need these methods.

## Create secret

### Request

Path: `/secret/create`

Method: `POST`

Data (FormData):

```js
 accessKey: varchar(64),
 manageKey: varchar(64),
 contentHash: text,
 testHash: varchar(64), // used to validate decoding
 isProtected: boolean,
 isBurnable: boolean,
 lifetime: int, // seconds from now
 v: '0.2',
```

### Response

```js
{
    "code": 200,
    "data": {
        "uuid": "ba7fe174-024f-44e7-845c-65c87e489a6e",
        "success": true
    }
}
```

## Get secret

### Request

Path: `/secret/get/{accessKey}`

Method: `GET`

### Response

```js
{
    "code": 200,
    "data": {
        "uuid": "40a7fc90-29f4-41fd-9836-2deafb72f566",
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
