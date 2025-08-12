import { ref, watch } from 'vue';
import { customAlphabet } from 'nanoid';
import { Buffer } from 'buffer';
import { log } from './utils';
import axios from 'axios';
import Storage from './storage';

/**
 * Create and handle secret form submission
 * @param {Object} options - Configuration options
 * @param {Object} options.cryptojs - Injected CryptoJS instance
 * @param {Object} options.router - Vue Router instance
 * @returns {Object} Form state and submission function
 */
export const useSecretForm = (options) => {
  const { cryptojs, router } = options;
  const storage = new Storage();

  // Form state
  const submitIsEnabled = ref(false);
  const submitInProcess = ref(false);
  const secretContent = ref('');
  const secretPassword = ref('');
  const secretLifetime = ref(30 * 24 * 60 * 60); // Default: 1 month
  const secretIsBurnable = ref(false);

  // Helper functions
  const symbolsString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const nanoid = customAlphabet(symbolsString, 16);
  const hashString = (string) => cryptojs.SHA256(string).toString();
  const base64ToHex = (str) => Buffer.from(str, 'base64').toString('hex');

  /**
   * Process form submission and create a new secret
   */
  const processForm = async () => {
    // Set loading status
    submitInProcess.value = true;
    // Disable submit button
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
      `${prefix}${hashString(`${clientSecretPasswordHash}${accessKeyHash1}`)}`
    );
    const testHash = base64ToHex(
      cryptojs.AES.encrypt(import.meta.env.VITE_TEST_STRING, contentEncryptionString).toString()
    );
    const encryptedSecretContentBase64 = cryptojs.AES.encrypt(
      clientSecretContent,
      contentEncryptionString
    ).toString();
    const encryptedSecretContent = base64ToHex(encryptedSecretContentBase64);
    const contentHexHash = hashString(encryptedSecretContent);
    const secretIsProtectedWithPassword = secretPassword.value.length > 0;
    const sid = hashString(accessKeyHash2).slice(0, 20);
    const dataHash = hashString(
      `${accessKeyHash2}${manageKeyHash2}${contentHexHash}${secretIsProtectedWithPassword}${secretLifetime.value}${secretIsBurnable.value}`
    ); // hash to check if secret was changed

    // Save on the API
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
    if (res.status === 201 && res.data.data.success === true) {
      log(`secret saved`);

      // Save into storage
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
        secretLifetime.value * 1000
      );

      // Go to manage page
      router.push({ path: '/manage', hash: `#${sid}` });
    } else {
      // TODO: error
      log('FAILED');
    }
  };

  // Watch for changes in secretContent to enable/disable submit button
  watch(secretContent, (newVal) => {
    submitIsEnabled.value = newVal.length > 0;
  });

  return {
    // Exposed state
    submitIsEnabled,
    submitInProcess,
    secretContent,
    secretPassword,
    secretLifetime,
    secretIsBurnable,

    // Methods
    processForm,
  };
};
