import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';

const defaultLocale = import.meta.env.VITE_I18N_LOCALE;
const userLocale = getUserLocale();

// List of all locales.
export const allLocales = ['en', 'ru'];

// Create Vue I18n instance.
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: (allLocales.includes(userLocale) ? userLocale : defaultLocale),
  fallbackLocale: import.meta.env.VITE_I18N_FALLBACK_LOCALE,
  messages: messages,
});

// Set new locale.
export async function setLocale(locale) {
  // Load locale if not available yet.
  if (!i18n.global.availableLocales.includes(locale)) {
    const messages = await loadLocale(locale);

    // fetch() error occurred.
    if (messages === undefined) {
      return;
    }

    // Add locale.
    i18n.global.setLocaleMessage(locale, messages);
  }

  // Set locale.
  i18n.global.locale.value = locale;
}

// Fetch locale.
async function loadLocale(locale) {
  try {
    const response = await fetch(`./locales/${locale}.json`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Something went wrong!');
    }
  } catch (error) {
    console.error(error);
  }
}

function getUserLocale() {
  return navigator.language || navigator.userLanguage;
}
