import { createApp } from 'vue';
// import { BootstrapIconsPlugin } from 'bootstrap-icons-vue';
import VueCryptojs from 'vue-cryptojs';
import Vue3Storage from 'vue3-storage';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';

import 'modern-normalize/modern-normalize.css';
import 'bootstrap/dist/css/bootstrap.min.css';

createApp(App)
  .use(router)
  .use(VueCryptojs)
  // .use(BootstrapIconsPlugin)
  .use(Vue3Storage, { namespace: 'timed_' })
  .mount('#app');
