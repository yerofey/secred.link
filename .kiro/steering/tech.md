# Technology Stack

## Build System
- **Vite** - Modern build tool and dev server
- **Node.js/pnpm** - Package management

## Frontend Framework
- **Vue.js 3** - Composition API with reactivity transforms
- **Vue Router 4** - Client-side routing
- **Vue I18n** - Internationalization

## UI & Styling
- **Bootstrap 5.3.2** - CSS framework with dark/light theme support
- **Bootstrap Icons Vue** - Icon components
- **SCSS** - CSS preprocessing
- **Modern Normalize** - CSS reset

## Key Libraries
- **CryptoJS** - Client-side encryption (AES, SHA256)
- **Axios** - HTTP client for API communication
- **VueUse** - Vue composition utilities (dark mode, head management)
- **Nanoid** - Secure ID generation
- **Moment.js** - Date/time handling
- **Vue Clipboard3** - Clipboard operations

## Development Tools
- **ESLint** - Code linting
- **Terser** - Code minification
- **Legacy Plugin** - Browser compatibility

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm serve        # Preview production build
```

### Environment Variables
- `VITE_API_URL` - Backend API endpoint
- `VITE_ENCRYPTION_SECRET_KEY` - Server-side encryption key
- `VITE_TEST_STRING` - Validation string for encryption tests
- `VITE_VERSION_PREFIX` - Version prefix for keys
- `VITE_STORAGE_VERSION` - LocalStorage schema version
- `VITE_I18N_LOCALE` - Default locale
- `VITE_I18N_FALLBACK_LOCALE` - Fallback locale

## Browser Support
- Modern browsers (ES6+)
- No IE11 support
- Progressive Web App capabilities