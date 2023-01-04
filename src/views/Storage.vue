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
                <BIconLockFill/> protected
              </div>
              <div v-else>
                <BIconUnlockFill/> not protected
              </div>
              <!-- eslint-disable-next-line vue/no-parsing-error -->
            </p>
            <span class="secret-date">
              {{ item.formattedDate }}
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

    // console.log('storage', localStorage.getStorageInfoSync());

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
          if (key.includes('timed_')) {
            const secretInfo = localStorage.getStorageSync(key.replace('timed_', ''));
            // TODO: validate required keys
            // secretInfo.date
            secretInfo.formattedDate = human(new Date(secretInfo.date));
            secretInfo.timestamp = Math.round(new Date(secretInfo.date).getTime() / 1000);
            // console.log('item', secretInfo);
            itemsObject[secretInfo.uuid] = secretInfo;
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
    box-shadow: 2px 3px 4px rgba(51,51,51,.06);

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
    }

    .secret-date {
      color: #9a9a9a;
      font-size: 12px;
    }
  }
}
</style>
