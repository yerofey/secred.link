# Product Overview

secred.link is a secure data sharing platform that allows users to safely share sensitive information like passwords, messages, or links through encrypted, time-limited secrets.

## Key Features
- End-to-end encryption using AES encryption with client-side encryption/decryption
- Secure link sharing with unique access and management keys
- Optional password protection for additional security layer
- Time-based expiration (5 minutes to 1 month)
- "Burn after read" functionality for one-time access
- Local storage for managing created secrets with TTL
- Multi-language support (English, Russian)
- Dark/light theme support with Bootstrap theming

## Architecture
- Frontend: Vue.js 3 SPA with client-side encryption
- Backend: Separate API service (api.secred.link)
- Storage: Browser localStorage for client-side secret management
- Encryption: CryptoJS for AES encryption and SHA256 hashing

## Security Model
- Content is encrypted client-side before transmission to API
- Access keys are double-hashed for security
- Test hash validation ensures proper decryption
- Password protection adds additional encryption layer
- No plaintext content ever reaches the server

## User Flow
1. User enters sensitive content on home page
2. Content is encrypted client-side with generated keys
3. Encrypted data is stored on API with hashed access/manage keys
4. User receives shareable link for secure access
5. Recipients can decrypt content with proper keys/passwords
6. Optional burn-after-read destroys secret after first access