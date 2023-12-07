<template>
  <div>
    <div v-if="isLoading" class="mt-4">{{ $t('common.loading') }}...</div>
    <div v-else class="form-container mt-4 pb-5">
      <div v-if="!isDeleted">
        <div v-if="isFound">
          <div v-if="isDecrypted">
            <div class="secret-content d-block border rounded p-3">
              <span v-if="isBurnable" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {{ $t('view.burned') }}!
              </span>
              <samp v-html="secretContentHTML"></samp>
            </div>
            <small class="text-muted mt-2 d-block">
              {{ $t('view.created_at') }}: {{ secretCreationDate }}
            </small>
          </div>
          <div v-else>
            <div class="secret-content d-block border rounded p-3">
              <form @submit.prevent="submitPassword">
                <div class="btn-toolbar">
                  <div class="input-group w-100">
                    <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
                    <div class="input-group-text" id="btnGroupAddon">{{ $t('home.form.password') }}</div>
                    <input type="password" class="form-control" :class="{ 'is-valid': (inputPassword.length > 0 && inputPasswordShowStatus && inputPasswordIsCorrect), 'is-invalid': (inputPassword.length > 0 && inputPasswordShowStatus && !inputPasswordIsCorrect) }" :placeholder="`${$t('view.passphrase')}`" v-model="inputPassword" autocomplete="off" v-focus>
                    <button class="btn btn-primary" type="submit">{{ $t('view.unlock') }}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div v-else>
          {{ $t('common.not_found') }}!
        </div>
        <div v-if="exists" class="mt-4">
          <button @click="deleteItemFromDevice" class="btn btn-sm button" type="button">
            <BIconXCircleFill/> <span class="span-after-icon">{{ $t('view.delete') }}</span>
          </button>
          <button v-if="canManage && isFound" @click="deleteItemFromCloud" class="btn btn-sm button delete-button" type="button">
            <BIconTrash2Fill/> <span class="span-after-icon">{{ $t('view.burn') }}</span>
          </button>
        </div>
      </div>
      <div v-else>
        {{ $t('view.deleted') }}!
      </div>
    </div>
  </div>
</template>

<script>
import {
  computed,
  ref,
  inject,
  onMounted,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import Storage from '../modules/storage';
import human from 'human-time';
import moment from 'moment';
import {
  BIconXCircleFill,
  BIconTrash2Fill,
} from 'bootstrap-icons-vue';
import axios from 'axios';
import { Buffer } from 'buffer';
import { log } from '../modules/utils';

export default {
  components: {
    BIconXCircleFill,
    BIconTrash2Fill,
  },
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
    const isBurnable = ref(false);
    const isDeleted = ref(false);
    const isDecrypted = ref(false);
    const isDeletable = ref(false);
    const isFound = ref(false);
    const isLoading = ref(true);
    const isReady = ref(false);
    const isProtected = ref(false);
    const secretItem = ref({});
    const secretCreationDate = ref('');
    const secretContent = ref('');
    const secretContentHTML = computed(() => secretContent.value.replace(/\n/g, "<br>"));
    const inputPassword = ref('');
    const inputPasswordIsCorrect = ref(false);
    const inputPasswordShowStatus = ref(false);
    const localItem = ref({});

    const getItemData = async () => {
      if (accessKey.length !== 17) {
        isFound.value = false;
        isLoading.value = false;
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/secret/get/${accessKeyHash2}`;

      try {
        const res = await axios.get(apiUrl);

        if (res.status === 200 && res.data) {
          const item = res.data.data;
          secretItem.value = item;
          secretCreationDate.value = moment(item.creation_date).format('YYYY-MM-DD HH:mm:ss');
          isBurnable.value = item.isBurnable;
          isDeletable.value = false;
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
                hasPassword: isProtected.value,
                timestamp: Math.floor(Date.now()),
                v: secretV,
              },
              lifetimeSeconds * 1000,
            );
          }

          if (isBurnable.value) {
            console.log('IS_BURNABLE');
          }
        } else {
          // log('API_SECRET_NOT_FOUND');
          isFound.value = false;

          deleteItemFromDevice();
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

        if (item.keys.manageKey !== undefined) {
          canManage.value = true;
          manageKey.value = item.keys.manageKey;
        }

        exists.value = true;
        localItem.value = item;
      } else {
        // log('NOT_FOUND');
      }
    };

    const deleteItemFromDevice = () => {
      storage.removeItem(`secret_${sid}`);
      isDeleted.value = true;
    }

    const deleteItemFromCloud = async () => {
      const manageKeyHash2 = hashString(hashString(manageKey.value));
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/secret/delete/${accessKeyHash2}/${manageKeyHash2}`);
      if (res.status === 200 && res.data.data.success === true) {
        log('DELETED');

        deleteItemFromDevice();
      } else {
        log('FAILED');
      }
    }

    // eslint-disable-next-line no-unused-vars
    const decryptSecret = () => {
      const item = secretItem.value;
      const clientSecretPasswordHash = hashString(inputPassword.value);
      const contentEncryptionString = hashString(`${prefix}${hashString(`${clientSecretPasswordHash}${accessKeyHash1}`)}`);
      const contentBase64 = hexToBase64(item.content);
      const testBase64 = hexToBase64(item.test);
      // TODO: compare client password hash with passHash
      try {
        // eslint-disable-next-line max-len
        const decryptedTest = CryptoJS.AES.decrypt(testBase64, contentEncryptionString).toString(CryptoJS.enc.Utf8);
        if (decryptedTest === import.meta.env.VITE_TEST_STRING) {
          isDecrypted.value = true;
          inputPasswordIsCorrect.value = true;
          inputPasswordShowStatus.value = true;
        } else {
          inputPasswordIsCorrect.value = false;
          inputPasswordShowStatus.value = true;
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
      if (newVal === true && secretItem.value.content !== undefined && isProtected.value === false) { // (isProtected.value === false || isOwner.value === true)
        decryptSecret();
      }
    });

    watch(inputPassword, (newVal, oldVal) => {
      if (newVal != oldVal) {
        inputPasswordShowStatus.value = false;
      }
    });

    onMounted(() => {
      updateRights();
      getItemData();
    });

    return {
      canManage,
      manageKey,
      exists,
      isBurnable,
      isDecrypted,
      isDeleted,
      isDeletable,
      isFound,
      isLoading,
      isProtected,
      secretCreationDate,
      secretContent,
      secretContentHTML,
      inputPassword,
      inputPasswordIsCorrect,
      inputPasswordShowStatus,
      deleteItemFromDevice,
      deleteItemFromCloud,
      submitPassword,
      human,
    };
  },
};
</script>

<style lang="scss" scoped>
.secret-content {
  position: relative;

  background-color: var(--app-secondary-bg);


  > samp {
    color: var(--bs-emphasis-color);
    overflow-wrap: break-word;
  }
}

.delete-button {
  margin-left: 0.5rem;
}
</style>
