import { createApp } from 'vue';
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
  .use(VueCryptojs)
  // .use(BootstrapIconsPlugin)
  .mount('#app');
