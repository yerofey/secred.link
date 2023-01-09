<template>
  <div>
    <h4>New Secret Created</h4>
    <div v-if="isLoading" class="mt-4">Loading info...</div>
    <div v-else class="form-container mt-4">
      <div v-if="secretItem !== {}" class="mb-3 copy-input-line">
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
      <div v-else>
        Item not found on this device.
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Storage from '../modules/storage';
import {
  BIconClipboard,
  BIconClipboardCheck,
  // BIconXCircleFill,
} from 'bootstrap-icons-vue';
import useClipboard from 'vue-clipboard3';
import { log } from '../modules/utils';

export default {
  components: {
    BIconClipboard,
    BIconClipboardCheck,
    // BIconXCircleFill,
  },
  setup() {
    const route = useRoute();
    const storage = new Storage();
    const { toClipboard } = useClipboard();

    const hash = route.hash.substring(1);
    // TODO: validate hash
    const sid = hash;

    const isLoading = ref(true);
    const isCopied = ref(false);
    const secretItem = ref({});
    const secretShareLink = ref('');

    const getLocalSecret = () => {
      const secretKey = `secret_${sid}`;
      if (storage.hasKey(secretKey)) {
        secretItem.value = storage.getItem(secretKey);

        if (secretItem.value.keys.accessKey !== undefined) {
          secretShareLink.value = `${import.meta.env.VITE_APP_URL}/view#${secretItem.value.keys.accessKey}`;
        }
      } else {
        log('NO_KEY');
      }

      isLoading.value = false;
    }

    const copyLink = async () => {
      try {
        await toClipboard(secretShareLink.value);
        isCopied.value = true;
      } catch (e) {
        console.error(e);
      }
    };

    onMounted(() => {
      getLocalSecret();
    });

    return {
      isLoading,
      isCopied,
      secretItem,
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
