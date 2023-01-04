<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vuejs-accessibility/form-control-has-label vuejs-accessibility/label-has-for -->
<template>
  <form class="form-container" @submit.prevent="processForm">
    <div class="mb-4">
      <h5>Secure any data: password, message or link</h5>
      <h6>Keep sensitive info out of your chats and notes</h6>
    </div>
    <div class="mb-3">
      <textarea
        class="form-control"
        maxlength="2048"
        rows="4"
        placeholder="Insert content here you want to secure..."
        v-model="secretContent"
      ></textarea>
    </div>
    <!-- <div class="mb-3 input-group">
      <label class="input-group-text" for="inputGroupSelect01">Password</label>
      <input
        type="text"
        class="form-control"
        id="inputGroupSelect01"
        placeholder="Passphrase to access your secret"
        autocomplete="off"
        v-model="secretPassword"
      />
    </div> -->
    <!-- <div class="mb-3 input-group">
      <label class="input-group-text" for="inputGroupSelect02">Expires In</label>
      <select class="form-select" id="inputGroupSelect02" v-model="secretLifetime">
        <option value="30d" selected>30 days</option>
        <option value="7d">7 days</option>
        <option value="3d">3 days</option>
        <option value="1d">1 day</option>
        <option value="12h">12 hours</option>
        <option value="6h">6 hours</option>
        <option value="3h">3 hours</option>
        <option value="1h">1 hour</option>
        <option value="30m">30 minutes</option>
        <option value="5m">5 minutes</option>
      </select>
    </div> -->
    <div class="mb-3">
      <button
        @click="processForm"
        type="button"
        class="btn btn-primary btn-lg submit-button"
        :disabled="!submitIsEnabled"
      >
        <BIconPlusCircleFill /> <span class="span-after-icon">Create secret</span>
      </button>
    </div>
  </form>
</template>

<script>
import { ref, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStorage } from 'vue3-storage';
import { customAlphabet } from 'nanoid';
import { BIconPlusCircleFill } from 'bootstrap-icons-vue';
import axios from 'axios';

const { Buffer } = require('buffer/');

export default {
  components: {
    BIconPlusCircleFill,
  },
  setup() {
    const CryptoJS = inject('cryptojs');
    const router = useRouter();
    const localStorage = useStorage();

    const isLoading = ref(false);
    const submitIsEnabled = ref(false);
    const secretContent = ref('');
    const secretPassword = ref('');
    const secretLifetime = ref('7d');

    const symbolsString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const hashString = (string) => CryptoJS.SHA256(string).toString();
    const nanoid = customAlphabet(symbolsString, 16);
    // const base64ToHex = (str) => {
    //   const raw = atob(str);
    //   let result = '';
    //   // eslint-disable-next-line no-plusplus
    //   for (let i = 0; i < raw.length; i += 1) {
    //     const hex = raw.charCodeAt(i).toString(16);
    //     result += (hex.length === 2 ? hex : `0${hex}`);
    //   }
    //   return result;
    // };
    const base64ToHex = (str) => Buffer.from(str, 'base64').toString('hex');
    const processForm = async () => {
      const clientSecretContent = secretContent.value;
      const clientSecretPassword = secretPassword.value;
      isLoading.value = true;

      const prefix = '0';
      const uuid = nanoid();
      // const secretHash = hashString(customAlphabet(symbolsString, 64)());
      const clientSecretPasswordHash = hashString(clientSecretPassword);
      const accessKey = prefix + nanoid();
      const accessKeyHash1 = hashString(accessKey);
      const accessKeyHash2 = hashString(accessKeyHash1);
      const manageKey = prefix + nanoid();
      const manageKeyHash1 = hashString(manageKey);
      const manageKeyHash2 = hashString(manageKeyHash1);
      // eslint-disable-next-line max-len
      // const testHash = hashString(`${prefix}${customAlphabet(symbolsString, 64)()}${new Date()}`);

      const contentEncryptionString = hashString(
        `${prefix}${hashString(`${clientSecretPasswordHash}${accessKeyHash1}`)}`,
      );
      // eslint-disable-next-line max-len
      const encryptedSecretContentBase64 = CryptoJS.AES.encrypt(
        clientSecretContent,
        contentEncryptionString,
      ).toString();
      const encryptedSecretContent = base64ToHex(encryptedSecretContentBase64);
      // eslint-disable-next-line max-len
      // const encryptedEditTestHash = base64ToHex(CryptoJS.AES.encrypt(testHash, manageKeyHash1).toString());
      // eslint-disable-next-line max-len
      // const encryptedViewTestHash = base64ToHex(CryptoJS.AES.encrypt(testHash, accessKeyHash1).toString());

      // console.log('SECRET_HASH', secretHash);
      // console.log('accessKey', accessKey);
      // console.log('accessKey_HASH', accessKeyHash1, accessKeyHash2);
      // console.log('ENCRYPTED_CONTENT', encryptedSecretContent);
      // console.log('CONTENT_BASE64', encryptedSecretContentBase64);
      // console.log('ENCRYPTED_PASSWORD', encryptedSecretPassword);
      // console.log('ENCRYPTION_STRING', contentEncryptionString);
      // console.log('manageKey', manageKey);
      // console.log('manageKey_HASH', manageKeyHash1, manageKeyHash2);

      const lifetimeSeconds = 7 * 24 * (60 * 60 * 1000); // 7 days

      // save on the API
      const save = true;
      if (save) {
        const data = {
          // testhash: testHash,
          // viewtesthash: encryptedViewTestHash,
          // edittesthash: encryptedEditTestHash,
          accessKey: accessKeyHash2,
          manageKey: manageKeyHash2,
          contentHash: encryptedSecretContent,
          isProtected: clientSecretPassword.length > 0,
          lifetime: lifetimeSeconds,
        };
        // console.log('data', data);
        const res = await axios.post(`${process.env.VUE_APP_API_URL}/create`, data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
        });
        // console.log('res', res);
        if (res.status === 200 && res.data.success === true) {
          isLoading.value = false;
          // const secretUuid = res.data.uuid || uuid;
          // save into localstorage
          localStorage.setStorageSync(
            `secret_${uuid}`,
            {
              uuid,
              keys: {
                manageKey,
                accessKey,
              },
              hasPassword: clientSecretPassword.length > 0,
              date: new Date(),
            },
            lifetimeSeconds,
          );
          // go to editing page
          router.push({ path: '/edit', hash: `#${manageKey}` });
        } else {
          // TODO: error
          console.error('FAILED TO CREATE');
        }
      }
    };

    // eslint-disable-next-line no-unused-vars
    watch(secretContent, (newVal, oldVal) => {
      submitIsEnabled.value = newVal.length > 0;
    });

    return {
      isLoading,
      submitIsEnabled,
      secretContent,
      secretPassword,
      secretLifetime,
      processForm,
    };
  },
};
</script>

<style lang="scss" scoped></style>
