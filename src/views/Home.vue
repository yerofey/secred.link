<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable-next-line max-len -->
<!-- eslint-disable vuejs-accessibility/form-control-has-label vuejs-accessibility/label-has-for -->
<!-- eslint-disable vue/no-unused-vars -->
<template>
  <form class="form-container" @submit.prevent="processForm">
    <div class="mb-4">
      <h5>Secure any data: password, message or link</h5>
      <h6>Keep sensitive info out of your chats and notes</h6>
    </div>
    <div>
      <textarea
        class="form-control"
        maxlength="2048"
        rows="4"
        placeholder="Insert the content you want to secure..."
        autofocus
        autocorrect="off"
        v-model="secretContent"
      ></textarea>
    </div>
    <div class="group-optional mt-4 mb-4">
      <div class="mb-2 input-group text-muted">
        <small>OPTIONAL</small>
      </div>
      <div class="mb-3 input-group">
        <label class="input-group-text" for="inputGroupSelect01">Password</label>
        <input
          type="text"
          class="form-control"
          id="inputGroupSelect01"
          placeholder="Passphrase to access your secret"
          autocomplete="off"
          maxlength="64"
          v-model="secretPassword"
        />
      </div>
      <div class="mb-3 input-group">
        <label class="input-group-text" for="inputGroupSelect02">Expires In</label>
        <select class="form-select" id="inputGroupSelect02" v-model="secretLifetime">
          <option :value="5 * 60">5 minutes</option>
          <option :value="10 * 60">10 minutes</option>
          <option :value="30 * 60">30 minutes</option>
          <option :value="60 * 60">60 minutes</option>
          <option :value="3 * 60 * 60">3 hours</option>
          <option :value="6 * 60 * 60">6 hours</option>
          <option :value="12 * 60 * 60">12 hours</option>
          <option :value="24 * 60 * 60">24 hours</option>
          <option :value="3 * 24 * 60 * 60">3 days</option>
          <option :value="7 * 24 * 60 * 60">7 days</option>
          <option :value="14 * 24 * 60 * 60">14 days</option>
          <option :value="30 * 24 * 60 * 60" selected>30 days</option>
        </select>
      </div>
      <div class="input-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" v-model="secretIsBurnable">
        <label class="form-check-label" for="flexCheckDefault">
          &nbsp; Burn after read
        </label>
      </div>
    </div>
    <div class="mb-3 form-buttons">
      <button
        @click="processForm"
        type="button"
        class="btn btn-primary btn-lg submit-button"
        :class="{
          'is-loading': submitInProcess,
        }"
        :disabled="!submitIsEnabled"
      >
        <!-- eslint-disable-next-line max-len -->
        <BIconPlusCircleFill />&nbsp;<span class="span-after-icon">{{ submitInProcess ? 'Creating...' : 'Create Secret' }}</span>
      </button>
    </div>
  </form>
</template>

<script>
import {
  ref,
  inject,
  watch,
  // onMounted,
} from 'vue';
import { useRouter } from 'vue-router';
import { customAlphabet } from 'nanoid';
import { BIconPlusCircleFill } from 'bootstrap-icons-vue';
import axios from 'axios';
import querystring from 'querystring';
import Storage from '../modules/storage';
import { Buffer } from 'buffer';
import { log } from './../modules/utils';

export default {
  components: {
    BIconPlusCircleFill,
  },
  setup() {
    const CryptoJS = inject('cryptojs');
    const router = useRouter();
    const storage = new Storage();

    const submitIsEnabled = ref(false);
    const submitInProcess = ref(false);
    const secretContent = ref('');
    const secretPassword = ref('');
    const secretLifetime = ref((30 * 24 * 60 * 60));
    const secretIsBurnable = ref(false);

    const symbolsString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const nanoid = customAlphabet(symbolsString, 16);
    const hashString = (string) => CryptoJS.SHA256(string).toString();
    const base64ToHex = (str) => Buffer.from(str, 'base64').toString('hex');

    // eslint-disable-next-line no-promise-executor-return
    const processForm = async () => {
      // add loading status
      submitInProcess.value = true;
      // disable submit button
      submitIsEnabled.value = false;

      const clientSecretContent = secretContent.value;
      const clientSecretPassword = secretPassword.value;
      const prefix = `${import.meta.env.VITE_VERSION_PREFIX}`;
      const clientSecretPasswordHash = hashString(clientSecretPassword);
      // const passHash = hashString(clientSecretPasswordHash);
      const accessKey = prefix + nanoid();
      const accessKeyHash1 = hashString(accessKey);
      const accessKeyHash2 = hashString(accessKeyHash1);
      const manageKey = prefix + nanoid();
      const manageKeyHash1 = hashString(manageKey);
      const manageKeyHash2 = hashString(manageKeyHash1);
      const contentEncryptionString = hashString(
        `${prefix}${hashString(`${clientSecretPasswordHash}${accessKeyHash1}`)}`,
      );
      const testHash = base64ToHex(
        CryptoJS.AES.encrypt(
          import.meta.env.VITE_TEST_STRING,
          contentEncryptionString,
        ).toString(),
      );
      // eslint-disable-next-line max-len
      const encryptedSecretContentBase64 = CryptoJS.AES.encrypt(
        clientSecretContent,
        contentEncryptionString,
      ).toString();
      const encryptedSecretContent = base64ToHex(encryptedSecretContentBase64);
      const contentHexHash = hashString(encryptedSecretContent);
      const secretIsProtectedWithPassword = (secretPassword.value.length > 0);
      // const defaultLifetime = 3 * 24 * (60 * 60 * 1000); // 3 days
      const sid = hashString(accessKeyHash2).slice(0, 20);
      const dataHash = hashString(`${accessKeyHash2}${manageKeyHash2}${contentHexHash}${secretIsProtectedWithPassword}${secretLifetime.value}${secretIsBurnable.value}`); // hash to check if secret was changed

      // save on the API
      const secretData = {
        accessKey: accessKeyHash2, // 2x hashed
        manageKey: manageKeyHash2, // 2x hashed
        contentHash: encryptedSecretContent,
        testHash,
        isProtected: secretIsProtectedWithPassword,
        isBurnable: secretIsBurnable.value,
        lifetime: secretLifetime.value,
        v: import.meta.env.VITE_VERSION_PREFIX,
      };
      log(`secret: ${secretData}`);
      const createSecretUrl = `${import.meta.env.VITE_API_URL}/secret/create`;
      const res = await axios.post(createSecretUrl, querystring.stringify(secretData));
      if (res.status === 200 && res.data.data.success === true) {
        log(`SECRED_SAVED ${JSON.stringify(res.data.data)}`);
        // save into storage
        storage.setItem(
          `secret_${sid}`,
          {
            sid,
            hash: dataHash,
            keys: {
              accessKey,
              manageKey,
              decodeKey: contentEncryptionString,
            },
            isOwner: true,
            isEncoded: false,
            hasPassword: secretIsProtectedWithPassword,
            isBurnable: secretIsBurnable.value,
            timestamp: Math.floor(Date.now()),
            v: import.meta.env.VITE_STORAGE_VERSION,
          },
          (secretLifetime.value * 1000),
        );
        // go to editing page
        router.push({ path: '/new', hash: `#${sid}` });
      } else {
        // TODO: error
        log('FAILED_TO_CREATE');
      }
    };

    // eslint-disable-next-line no-unused-vars
    watch(secretContent, (newVal, oldVal) => {
      submitIsEnabled.value = newVal.length > 0;
    });

    return {
      submitIsEnabled,
      submitInProcess,
      secretContent,
      secretPassword,
      secretLifetime,
      secretIsBurnable,
      processForm,
    };
  },
};
</script>

<style lang="scss" scoped>
.form-container {
  .group-optional {
    padding: 5px 0 5px 15px;
    border-left: 2px solid #ccc;
    // border-right: 2px solid #ccc;
  }

  .input-check {
    text-align: left;

    user-select: none;
  }

  .form-buttons {
    text-align: left;
  }

  .submit-button.is-loading {
    cursor: wait !important;
    pointer-events: all !important;
  }
}
</style>
