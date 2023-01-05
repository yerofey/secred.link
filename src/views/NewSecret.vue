<template>
  <div>
    <h4>New Secret Created</h4>
    <div v-if="isLoading" class="mt-4">Loading info...</div>
    <div v-else class="form-container mt-4">
      <div class="mb-3 copy-input-line">
        <!-- eslint-disable-next-line max-len -->
        <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label vuejs-accessibility/label-has-for -->
        <label class="form-label" for="inputGroupSelect01">Share Link</label>
        <input
          type="text"
          class="form-control"
          id="inputGroupSelect01"
          placeholder="Share link"
          autocomplete="off"
          readonly="true"
          onfocus="this.select();"
          onmouseup="return false;"
          :value="secretShareLink"
        />
        <button class="btn copy-button p-0" @click="copyLink">
          <BIconClipboardCheck v-if="isCopied"/>
          <BIconClipboard v-else/>
        </button>
      </div>
      <!-- <div class="mt-4 mb-2">
        <router-link
          :to="{
            name: 'delete',
            hash: `#${secretManageKey}`,
          }"
          class="btn btn-outline-secondary btn-sm"
        ><BIconXCircleFill/> <span class="span-after-icon">Delete this secret</span></router-link>
      </div> -->
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useStorage } from 'vue3-storage';
import {
  BIconClipboard,
  BIconClipboardCheck,
  // BIconXCircleFill,
} from 'bootstrap-icons-vue';
import useClipboard from 'vue-clipboard3';

export default {
  components: {
    BIconClipboard,
    BIconClipboardCheck,
    // BIconXCircleFill,
  },
  setup() {
    const route = useRoute();
    const localStorage = useStorage();
    const { toClipboard } = useClipboard();

    const isLoading = ref(true);
    const isCopied = ref(false);
    const secretManageKey = ref('');
    const secretAccessKey = ref('');
    const secretShareLink = ref('');

    const hash = route.hash.substring(1);
    // TODO: validate hash
    // secretManageKey.value = hash;

    const getLocalSecret = (manageKey) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const key of localStorage.getStorageInfoSync().keys) {
        if (key.includes(process.env.VUE_APP_STORAGE_PREFIX)) {
          const fixedKey = key.replace(`${process.env.VUE_APP_STORAGE_PREFIX}`, '');
          const secretItem = localStorage.getStorageSync(fixedKey);
          // console.log('__', key, fixedKey, secretItem);
          if (secretItem.keys.manageKey !== undefined && secretItem.keys.manageKey === manageKey) {
            // console.log('LOCAL_ITEM', secretItem);
            return secretItem;
          }
        }
      }

      return null;
    };

    const copyLink = async () => {
      try {
        await toClipboard(secretShareLink.value);
        isCopied.value = true;
      } catch (e) {
        console.error(e);
      }
    };

    const secretItem = getLocalSecret(hash);
    // console.log('ITEM', secretItem);
    secretManageKey.value = secretItem.keys.manageKey;
    secretAccessKey.value = secretItem.keys.accessKey;

    isLoading.value = false;
    secretShareLink.value = `${process.env.VUE_APP_URL}/view#${secretAccessKey.value}`;

    return {
      isLoading,
      isCopied,
      secretManageKey,
      secretShareLink,
      copyLink,
    };
  },
};
</script>

<style lang="scss" scoped>
.copy-input-line {
  position: relative;

  .form-control {
    padding-right: 43px;
  }

  .copy-button {
    position: absolute;
    top: 35px;
    right: 3px;

    width: 32px;
    height: 32px;

    background-color: #dcdee9;

    &:hover {
      background-color: #d0d2dd;
    }
  }
}
</style>
