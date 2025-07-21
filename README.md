# secred.link

> Secure any data: password, message or link

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🌐 **[Visit secred.link](https://secred.link)** | **[API Documentation](https://github.com/yerofey/api.secred.link)**

## Overview

[secred.link](https://secred.link) is a secure data sharing platform that allows you to safely share sensitive information like passwords, messages, or links. The data is encrypted and can only be accessed by the intended recipient.

The project consists of two parts:
- Frontend (this repository)
- [Backend API](https://github.com/yerofey/api.secred.link)

## Features

- 🔒 End-to-end encryption
- 🔗 Secure link sharing
- 📝 Message encryption
- 🔑 Password protection
- ⏰ Time-based expiration
- 🌐 Web-based interface

## API Documentation

The API is available at [api.secred.link](https://github.com/yerofey/api.secred.link). You can also run your own API instance locally with the following endpoints:

### Create Secret

**Endpoint**: `/secret/create`  
**Method**: `POST`  
**Request Body**:
```js
{
  "accessKey": "41c80e9ed6d1a3a41128a99a3c02749f0cbb9dc80902bac0a7aeb08b66591248", // string: 64 symbols
  "manageKey": "9b2959b7d3b2e684dde08960b1192a565f5823bde4bb1946f0043c2855bf83de", // string: 64 symbols
  "contentHash": "53616c7465645f5f548a620e4dda0eb3fc25b42519f1b4cd3d7b5f8cf373e9e7",
  "testHash": "53616c7465645f5f4443560ed15a0b34a384d7eb387e8ae71e9d92001e86891c", // string: 64 symbols
  "isProtected": false, // boolean
  "isBurnable": false, // boolean
  "lifetime": 2592000, // int
  "v": 0 // int
}
```
**Response** (201):
```js
{
  "data": {
    "success": true
  }
}
```

### Get Secret

**Endpoint**: `/secret/get/{accessKey}`  
**Method**: `GET`  
**Response** (200):
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

## Getting Started

### Prerequisites

- Node.js
- NPM or PNPM package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yerofey/secred.link.git
cd secred.link
```

2. Prepare config file:
```bash
cp .env.example .env
```

3. Install dependencies:
```bash
# using NPM
npm install

# using PNPM
pnpm install
```

### Development

Run the development server:
```bash
# using NPM
npm run dev

# using PNPM
pnpm dev
```

### Production Build

Build for production:
```bash
# using NPM
npm run build

# using PNPM
pnpm build
```

Preview production build:
```bash
# using NPM
npm run serve

# using PNPM
pnpm serve
```

## Contributing

Contributions are welcome! Feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Author

[Yerofey S.](https://github.com/yerofey)

## License

[MIT](https://github.com/yerofey/secred.link/blob/master/LICENSE)
