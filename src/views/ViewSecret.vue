<!-- eslint-disable max-len -->
<template>
  <div>
    <!-- <h4>View Secret</h4> -->
    <div v-if="isLoading" class="mt-4">Loading secret...</div>
    <div v-else class="form-container mt-4 pb-5">
      <div v-if="isFound">
        <div v-if="isDecrypted">
          <div class="secret-content d-block border rounded p-3">
            <samp>
              {{ secretContent }}
            </samp>
          </div>
          <small class="text-muted mt-2 d-block">
            created at: {{ secretCreationDate }}
          </small>
          <!-- <small v-if="isDeletable" class="text-muted text-center mt-4 d-block">
            <span v-if="canManage">
              This secret can only be read once, then it will be deleted.
            </span>
            <span v-else>
              This secret is already deleted, copy data if you need to save it.
            </span>
          </small> -->
          <!-- <div v-if="canManage" class="mt-4 mb-2">
            <router-link
              :to="{
                name: '1delete',
                hash: `#${manageKey}`,
              }"
              class="btn btn-outline-secondary btn-sm"
            ><BIconXCircleFill/> <span class="span-after-icon">Delete this secret</span></router-link>
          </div> -->
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
import Storage from '../modules/storage';
import human from 'human-time';
import moment from 'moment';
// import {
//   BIconXCircleFill,
// } from 'bootstrap-icons-vue';
// eslint-disable-next-line no-unused-vars
import axios from 'axios';

import { Buffer } from 'buffer';

export default {
  // components: {
  //   BIconXCircleFill,
  // },
  setup() {
    const CryptoJS = inject('cryptojs');
    const route = useRoute();
    const storage = new Storage();

    const hashString = (string) => CryptoJS.SHA256(string).toString();
    const hexToBase64 = (string) => Buffer.from(string, 'hex').toString('base64');
    const lifetimeSeconds = 30 * 24 * (60 * 60 * 1000); // 30 days

    const accessKey = route.hash.substring(1);
    const accessKeyHash1 = hashString(accessKey);
    const accessKeyHash2 = hashString(accessKeyHash1);
    const prefix = accessKey.substring(0, 1);
    const sid = hashString(accessKeyHash2).slice(0, 20);

    const exists = ref(false);
    const canManage = ref(false);
    const isOwner = ref(false);
    const manageKey = ref('');
    const isDecrypted = ref(false);
    const isDeletable = ref(false);
    const isFound = ref(false);
    const isLoading = ref(true);
    const isReady = ref(false);
    const isProtected = ref(false);
    const secretItem = ref({});
    const secretCreationDate = ref('');
    const secretContent = ref('');
    const secretPassword = ref('');
    const localItem = ref({});

    const getItemData = async () => {
      if (accessKey.length !== 17) {
        isFound.value = false;
        isLoading.value = false;
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/secret/get/${accessKeyHash2}`;
      // if (canManage.value === true) {
      //   const manageKeyHash1 = hashString(manageKey.value);
      //   const manageKeyHash2 = hashString(manageKeyHash1);
      //   apiUrl += `/${manageKeyHash2}`;
      // }

      try {
        const res = await axios.get(apiUrl);
        console.log('API_RES', res.data);
        if (res.status === 200 && res.data) {
          const item = res.data.data;
          secretItem.value = item;
          secretCreationDate.value = moment(item.creation_date).format('YYYY-MM-DD HH:mm:ss');
          isDeletable.value = false; // item.is_deletable;
          isProtected.value = item.isProtected;
          isFound.value = true;
          isReady.value = true;

          // save item in local storage
          const saveLocally = true;
          const secretKey = `secret_${sid}`;
          const secretV = accessKey.slice(0, 1);
          if (!exists.value && !storage.hasKey(secretKey) && saveLocally) {
            storage.setItem(
              secretKey,
              {
                sid,
                keys: {
                  accessKey,
                },
                isOwner: false,
                isEncoded: false,
                hasPassword: isProtected.value,
                timestamp: Math.floor(Date.now()),
                v: secretV,
              },
              lifetimeSeconds * 1000,
            );
          }
        } else {
          console.log('API_SECRET_NOT_FOUND');
          isFound.value = false;
        }
      } catch (err) {
        isFound.value = false;
      }

      isLoading.value = false;
    };

    const updateRights = () => {
      const secretKey = `secret_${sid}`;
      if (storage.hasKey(secretKey)) {
        const item = storage.getItem(secretKey);

        // TODO:
        //     if (item.keys.manageKey !== undefined) {
        //       canManage.value = true;
        //       manageKey.value = item.keys.manageKey;
        //     }

        //     // if (item.keys.decodeKey !== undefined) {
        //     //   console.log('IS_OWNER');
        //     //   isOwner.value = true;
        //     // }

        exists.value = true;
        localItem.value = item;
      } else {
        console.log('NOT_FOUND');
      }
    };

    // eslint-disable-next-line no-unused-vars
    const decryptSecret = () => {
      // console.log('decrypt');
      const item = secretItem.value;
      const clientSecretPasswordHash = hashString(secretPassword.value);
      const contentEncryptionString = (isOwner.value ? localItem.value.decodeKey : hashString(`${prefix}${hashString(`${clientSecretPasswordHash}${accessKeyHash1}`)}`));
      const contentBase64 = hexToBase64(item.content);
      const testBase64 = hexToBase64(item.test);
      // console.log('contentEncryptionString', contentEncryptionString);
      // TODO: compare client password hash with passHash
      try {
        // eslint-disable-next-line max-len
        const decryptedTest = CryptoJS.AES.decrypt(testBase64, contentEncryptionString).toString(CryptoJS.enc.Utf8);
        if (decryptedTest === import.meta.env.VITE_TEST_STRING) {
          isDecrypted.value = true;
        }
        // TODO: on failed decryption
        // eslint-disable-next-line max-len
        const decryptedContent = CryptoJS.AES.decrypt(contentBase64, contentEncryptionString).toString(CryptoJS.enc.Utf8);
        secretContent.value = decryptedContent;
      } catch (err) {
        console.error('ERORR', err);
      }
    };
    const submitPassword = () => {
      decryptSecret();
    };

    // eslint-disable-next-line no-unused-vars
    watch(isReady, (newVal, oldVal) => {
      // eslint-disable-next-line max-len
      if (newVal === true && secretItem.value.content !== undefined && (isProtected.value === false || isOwner.value === true)) {
        decryptSecret();
      }
    });

    onMounted(() => {
      updateRights();
      getItemData();
    });

    return {
      canManage,
      manageKey,
      isDecrypted,
      isDeletable,
      isFound,
      isLoading,
      isProtected,
      secretCreationDate,
      secretContent,
      secretPassword,
      submitPassword,
      human,
    };
  },
};
</script>

<style lang="scss" scoped>
.secret-content {
  background-color: #fff;
}
</style>
