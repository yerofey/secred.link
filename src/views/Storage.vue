<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <h4>Local Storage</h4>
    <div v-if="isLoading" class="mt-4">Loading info...</div>
    <div v-else class="form-container mt-4">
      <div class="secret-items mb-3" v-if="!storageIsEmpty">
        <router-link v-for="item in items" :key="item.uuid" class="card secret-item" :to="{
            name: 'view',
            hash: `#${item.keys.accessKey}`,
          }">
          <div class="card-body">
            <!-- eslint-disable-next-line max-len -->
            <h6 class="card-title secret-title">
              Secret
            </h6>
            <p class="card-text secret-info text-muted">
              <div v-if="item.hasPassword">
                <BIconLockFill/> is protected
              </div>
              <div v-else>
                <BIconUnlockFill/> is not protected
              </div>
              <!-- eslint-disable-next-line vue/no-parsing-error -->
            </p>
            <span class="secret-date">
              {{ item.displayDate }}
            </span>
          </div>
        </router-link>
      </div>
      <div v-else>
        Storage is empty!
      </div>
      <div class="mb-4">
        <small class="text-muted">
          Keys for these secrets are stored on this device only.
        </small>
      </div>
      <div class="mb-3" v-if="!storageIsEmpty">
        <button @click="clearStorage" type="button" class="btn btn-sm btn-outline-danger">
          <BIconTrash2Fill/> <span class="span-after-icon">Clear device cache</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStorage } from 'vue3-storage';
import human from 'human-time';
import {
  BIconTrash2Fill,
  BIconLockFill,
  BIconUnlockFill,
} from 'bootstrap-icons-vue';

export default {
  components: {
    BIconTrash2Fill,
    BIconLockFill,
    BIconUnlockFill,
  },
  setup() {
    const localStorage = useStorage();

    const isLoading = ref(false);
    const items = ref({});
    const storageIsEmpty = ref(true);

    console.log('storage', localStorage.getStorageInfoSync());

    const clearStorage = () => {
      localStorage.clearStorageSync();
      // TODO: check if emptied
      items.value = {};
      storageIsEmpty.value = true;
    };

    const displayItems = () => {
      const itemsObject = {};
      if (localStorage.getStorageInfoSync().keys.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key of localStorage.getStorageInfoSync().keys) {
          if (key.includes(`${process.env.VUE_APP_STORAGE_PREFIX}`)) {
            // eslint-disable-next-line prefer-const
            const secretInfo = localStorage.getStorageSync(key.replace(`${process.env.VUE_APP_STORAGE_PREFIX}`, ''));
            const newItem = { ...secretInfo };
            console.log('item', newItem);
            // TODO: validate required keys
            // eslint-disable-next-line max-len
            const itemTimestamp = (secretInfo.timestamp !== undefined ? (secretInfo.timestamp * 1000) : Date.now());
            newItem.displayDate = human(new Date(itemTimestamp));
            itemsObject[secretInfo.sid] = newItem;
          }
        }
      }

      // eslint-disable-next-line max-len
      const sortedItemsKeys = Object.keys(itemsObject).sort((keyA, keyB) => itemsObject[keyB].timestamp - itemsObject[keyA].timestamp);
      const sortedItems = {};
      sortedItemsKeys.forEach((key) => {
        sortedItems[key] = itemsObject[key];
      });

      storageIsEmpty.value = sortedItems.length === 0;
      items.value = sortedItems;
    };

    onMounted(() => {
      displayItems();
    });

    return {
      isLoading,
      clearStorage,
      storageIsEmpty,
      items,
    };
  },
};
</script>

<style lang="scss" scoped>
.secret-items {
  display: flex;
  // padding: 20px 0;
  flex-flow: row wrap;
  align-content: flex-start;
  justify-content: center;

  .secret-item {
    margin: 7px;
    display: flex;
    max-width: 190px;
    min-width: 190px;
    flex-direction: column;
    background-color: #fff;
    // box-shadow: 2px 3px 4px rgba(51,51,51,.06);
    box-shadow: 0 0 24px -8px #0000001a;

    text-decoration: none;

    &:hover {
      background-color: #fafaff;
      border-color: #bcbec7;
    }

    .secret-title {
      margin-bottom: 0;
    }

    .secret-info {
      margin-bottom: 0;

      font-size: 14px;

      svg {
        vertical-align: top;
      }
    }

    .secret-date {
      color: #9a9a9a;
      font-size: 12px;
    }
  }
}
</style>
