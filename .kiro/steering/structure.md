# Project Structure

## Root Directory
- `index.html` - Main HTML entry point
- `vite.config.js` - Vite build configuration
- `package.json` - Dependencies and scripts
- `.env` / `.env.example` - Environment variables

## Source Structure (`src/`)

### Core Application
- `main.js` - Vue app initialization and global setup
- `App.vue` - Root component with layout, theme switching, and navigation
- `router/index.js` - Vue Router configuration

### Views (`src/views/`)
- `Home.vue` - Secret creation form
- `ManageSecret.vue` - Secret management interface
- `ViewSecret.vue` - Secret viewing/decryption interface
- `Storage.vue` - Local storage management

### Components (`src/components/`)
- `LocaleSelect.vue` - Language selection component

### Modules (`src/modules/`)
- `storage.js` - LocalStorage wrapper with TTL support
- `utils.js` - Utility functions (logging, sleep)

### Internationalization (`src/i18n.js` + `src/locales/`)
- `i18n.js` - Vue I18n configuration and locale management
- `locales/en.json` - English translations
- `locales/ru.json` - Russian translations

## Static Assets (`public/`)
- `favicon.ico` - Main favicon
- `img/icons/` - App icons and favicons
- `robots.txt` - SEO configuration
- `site.webmanifest` - PWA manifest

## Configuration Files
- `.editorconfig` - Code formatting rules
- `.gitignore` - Git ignore patterns
- `pnpm-lock.yaml` - Dependency lock file

## Naming Conventions
- Vue components: PascalCase (e.g., `LocaleSelect.vue`)
- Views: PascalCase (e.g., `Home.vue`, `ManageSecret.vue`)
- Modules: camelCase (e.g., `storage.js`, `utils.js`)
- Routes: kebab-case paths (e.g., `/manage`, `/storage`)
- CSS classes: Bootstrap conventions + custom kebab-case

## Key Patterns
- Composition API with `setup()` function
- Reactive refs for component state
- Inject/provide for global services (CryptoJS)
- Custom Storage class for localStorage with TTL
- Environment-based configuration via Vite
- SCSS with Bootstrap integration
- Component-scoped styling