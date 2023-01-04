<!-- eslint-disable max-len -->
<template>
  <div>
    <h4>View Secret</h4>
    <div v-if="isLoading" class="mt-4">Loading info...</div>
    <div v-else class="form-container mt-4">
      <div v-if="isFound">
        <div v-if="isDecrypted">
          <div class="secret-content d-block border rounded p-3">
            <samp>
              {{ secretContent }}
            </samp>
          </div>
          <small v-if="isDeletable" class="text-muted text-center mt-4 d-block">
            <span v-if="canManage">
              This secret can only be read once, then it will be deleted.
            </span>
            <span v-else>
              This secret is already deleted, copy data if you need to save it.
            </span>
          </small>
          <div v-if="canManage" class="mt-4 mb-2">
            <router-link
              :to="{
                name: 'delete',
                hash: `#${manageKey}`,
              }"
              class="btn btn-outline-secondary btn-sm"
            ><BIconXCircleFill/> <span class="span-after-icon">Delete this secret</span></router-link>
          </div>
        </div>
        <div v-else>
          <form @submit.prevent="submitPassword">
            <div class="py-3">
              <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
              <input type="text" class="form-control" placeholder="Enter passphrase to decrypt secret" v-model="secretPassword">
            </div>
            <div class="">
              <button class="btn btn-primary" type="submit">Unlock</button>
            </div>
          </form>
        </div>
      </div>
      <div v-else>
        Secret not found!
      </div>
    </div>
  </div>
</template>

<script>
import {
  ref,
  inject,
  onMounted,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { useStorage } from 'vue3-storage';
import {
  BIconXCircleFill,
} from 'bootstrap-icons-vue';
// eslint-disable-next-line no-unused-vars
import axios from 'axios';

const { Buffer } = require('buffer');

export default {
  components: {
    BIconXCircleFill,
  },
  setup() {
    const CryptoJS = inject('cryptojs');
    const route = useRoute();
    const localStorage = useStorage();

    const hashString = (string) => CryptoJS.SHA256(string).toString();
    const hexToBase64 = (string) => Buffer.from(string, 'hex').toString('base64');

    const accessKey = route.hash.substring(1);
    const accessKeyHash1 = hashString(accessKey);
    const accessKeyHash2 = hashString(accessKeyHash1);
    const prefix = accessKey.substring(0, 1);

    const canManage = ref(false);
    const manageKey = ref('');
    const isDecrypted = ref(false);
    const isDeletable = ref(false);
    const isFound = ref(false);
    const isLoading = ref(true);
    const isProtected = ref(false);
    const secretItem = ref({});
    const secretContent = ref('');
    const secretPassword = ref('');

    const getItemData = async () => {
      let apiUrl = `http://localhost:3001/v1/get/a${accessKeyHash2}`;
      if (canManage.value === true) {
        const manageKeyHash1 = hashString(manageKey.value);
        const manageKeyHash2 = hashString(manageKeyHash1);

        apiUrl += `/m${manageKeyHash2}`;
      }

      try {
        const res = await axios.get(apiUrl);
        if (res.data && res.data.data.found) {
          const { data } = res.data;
          const { item } = data;

          secretItem.value = item;
          isDeletable.value = item.is_deletable;
          isProtected.value = item.is_protected;
          isFound.value = true;
        } else {
          isFound.value = false;
        }
      } catch (err) {
        isFound.value = false;
      }

      isLoading.value = false;
    };

    const updateRights = () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const key of localStorage.getStorageInfoSync().keys) {
        const item = localStorage.getStorageSync(key.replace('timed_', ''));
        if (item.keys.accessKey === accessKey) {
          canManage.value = true;
          manageKey.value = item.keys.manageKey;
          break;
        }
      }
    };

    // eslint-disable-next-line no-unused-vars
    const decryptSecret = () => {
      const item = secretItem.value;
      const clientSecretPasswordHash = hashString(secretPassword.value);
      const contentEncryptionString = hashString(`${prefix}${hashString(`${clientSecretPasswordHash}${accessKeyHash1}`)}`);
      const contentBase64 = hexToBase64(item.contenthex);
      try {
        // eslint-disable-next-line max-len
        const decryptedContent = CryptoJS.AES.decrypt(contentBase64, contentEncryptionString).toString(CryptoJS.enc.Utf8);
        secretContent.value = decryptedContent;
        isDecrypted.value = true;
      } catch (err) {
        console.error('ERORR', err);
      }
    };
    const submitPassword = () => {
      decryptSecret();
    };

    // eslint-disable-next-line no-unused-vars
    watch(isLoading, (newVal, oldVal) => {
      // eslint-disable-next-line max-len
      if (newVal === false && isProtected.value === false && secretItem.value.contenthex !== undefined) {
        decryptSecret();
      }
    });

    onMounted(() => {
      updateRights();

      if (accessKey.length === 17) {
        getItemData();
      }
    });

    return {
      canManage,
      manageKey,
      isDecrypted,
      isDeletable,
      isFound,
      isLoading,
      isProtected,
      secretContent,
      secretPassword,
      submitPassword,
    };
  },
};
</script>

<style lang="scss" scoped>
.secret-content {
  background-color: #fff;
}
</style>
