import { createApp } from 'vue';
import { i18n } from "./i18n.js";
// import localeEnglish from './locales/en.json';
// import localeRussian from './i18n/ru.json';
// import { BootstrapIconsPlugin } from 'bootstrap-icons-vue';
import VueCryptojs from 'vue-cryptojs';
import App from './App.vue';
import router from './router';

// delete old items
import Storage from './modules/storage';
const storage = new Storage();
const oldPrefix = 'secred__';
if (Object.values(storage.getAllItems(oldPrefix)).length > 0) {
  storage.removeAllItems(oldPrefix);
}

import 'modern-normalize/modern-normalize.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

createApp(App)
  .use(router)
  .use(i18n)
  .use(VueCryptojs)
  // .use(BootstrapIconsPlugin)
  .mount('#app');
