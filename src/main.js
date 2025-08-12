import { createApp } from 'vue';
import { i18n } from './i18n.js';
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

// styles
import 'modern-normalize/modern-normalize.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// app
const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(VueCryptojs);

// attr v-focus
app.directive('focus', {
  mounted(el) {
    el.focus();
  },
});

app.mount('#app');
