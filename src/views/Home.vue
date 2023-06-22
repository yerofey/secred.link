<template>
  <form class="form-container" @submit.prevent="processForm">
    <div class="mb-4">
      <h5>{{ $t('home.title') }}</h5>
      <h6>{{ $t('home.subtitle') }}</h6>
    </div>
    <div>
      <textarea
        class="form-control"
        maxlength="2048"
        rows="4"
        :placeholder="`${$t('home.form.insert')}...`"
        autocorrect="off"
        v-model="secretContent"
      ></textarea>
    </div>
    <div class="group-optional mt-4 mb-4">
      <div class="mb-2 input-group text-muted noselect">
        <small>{{ $t('home.form.optional') }}</small>
      </div>
      <div class="mb-3 input-group">
        <label class="input-group-text noselect" for="inputGroupSelect01">{{ $t('home.form.password') }}</label>
        <input
          type="text"
          class="form-control"
          id="inputGroupSelect01"
          :placeholder="`${$t('home.form.passphrase')}`"
          autocomplete="off"
          maxlength="64"
          v-model="secretPassword"
        />
      </div>
      <div class="mb-3 input-group">
        <label class="input-group-text noselect" for="inputGroupSelect02">{{ $t('home.form.expires') }}</label>
        <select class="form-select" id="inputGroupSelect02" v-model="secretLifetime">
          <option :value="5 * 60">5 {{ $t('common.minutes_5') }}</option>
          <option :value="10 * 60">10 {{ $t('common.minutes_5') }}</option>
          <option :value="30 * 60">30 {{ $t('common.minutes_5') }}</option>
          <option :value="60 * 60">1 {{ $t('common.hours_1') }}</option>
          <option :value="3 * 60 * 60">3 {{ $t('common.hours_2') }}</option>
          <option :value="6 * 60 * 60">6 {{ $t('common.hours_5') }}</option>
          <option :value="12 * 60 * 60">12 {{ $t('common.hours_5') }}</option>
          <option :value="24 * 60 * 60">24 {{ $t('common.hours_2') }}</option>
          <option :value="3 * 24 * 60 * 60">3 {{ $t('common.days_2') }}</option>
          <option :value="7 * 24 * 60 * 60">1 {{ $t('common.weeks_1') }}</option>
          <option :value="14 * 24 * 60 * 60">2 {{ $t('common.weeks_2') }}</option>
          <option :value="30 * 24 * 60 * 60" selected>1 {{ $t('common.months_1') }}</option>
        </select>
      </div>
      <div class="input-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" v-model="secretIsBurnable">
        <label class="form-check-label noselect" for="flexCheckDefault">
          &nbsp; {{ $t('home.form.burnable') }}
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
        <BIconPlusCircleFill />&nbsp;<span class="span-after-icon">{{ submitInProcess ? `${$t('home.form.creating')}...` : $t('home.form.create') }}</span>
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

    const processForm = async () => {
      // add loading status
      submitInProcess.value = true;
      // disable submit button
      submitIsEnabled.value = false;

      const clientSecretContent = secretContent.value;
      const clientSecretPassword = secretPassword.value;
      const prefix = `${import.meta.env.VITE_VERSION_PREFIX}`;
      const clientSecretPasswordHash = hashString(clientSecretPassword);
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
      const encryptedSecretContentBase64 = CryptoJS.AES.encrypt(
        clientSecretContent,
        contentEncryptionString,
      ).toString();
      const encryptedSecretContent = base64ToHex(encryptedSecretContentBase64);
      const contentHexHash = hashString(encryptedSecretContent);
      const secretIsProtectedWithPassword = (secretPassword.value.length > 0);
      const sid = hashString(accessKeyHash2).slice(0, 20);
      const dataHash = hashString(`${accessKeyHash2}${manageKeyHash2}${contentHexHash}${secretIsProtectedWithPassword}${secretLifetime.value}${secretIsBurnable.value}`); // hash to check if secret was changed

      // save on the API
      const secretData = {
        accessKey: accessKeyHash2, // 2x hashed
        manageKey: manageKeyHash2, // 2x hashed
        contentHash: encryptedSecretContent,
        testHash,
        isProtected: Boolean(secretIsProtectedWithPassword),
        isBurnable: Boolean(secretIsBurnable.value),
        lifetime: parseInt(secretLifetime.value),
        v: parseInt(import.meta.env.VITE_VERSION_PREFIX),
      };
      log(`saving secret...`);

      const createSecretUrl = `${import.meta.env.VITE_API_URL}/secret/create`;
      const res = await axios.post(createSecretUrl, secretData);
      if (res.status === 200 && res.data.data.success === true) {
        log(`secret saved`);

        // save into storage
        storage.setItem(
          `secret_${sid}`,
          {
            sid,
            hash: dataHash,
            keys: {
              accessKey,
              manageKey,
            },
            isOwner: true,
            hasPassword: secretIsProtectedWithPassword,
            isBurnable: secretIsBurnable.value,
            timestamp: Math.floor(Date.now()),
            v: import.meta.env.VITE_STORAGE_VERSION,
          },
          (secretLifetime.value * 1000),
        );

        // go to manage page
        router.push({ path: '/manage', hash: `#${sid}` });
      } else {
        // TODO: error
        log('FAILED');
      }
    };

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
  .noselect {
    user-select: none;
  }

  .group-optional {
    padding: 5px 0 5px 15px;
    border-left: 2px solid #ccc;
  }

  .input-check {
    text-align: left;
  }

  .form-buttons {
    text-align: center;
  }

  .submit-button.is-loading {
    cursor: wait !important;
    pointer-events: all !important;
  }
}
</style>
