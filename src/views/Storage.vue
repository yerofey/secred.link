<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <h4>Saved Secrets</h4>
    <div v-if="isLoading" class="mt-4">Loading info...</div>
    <div v-else class="form-container mt-4">
      <div class="secret-items mb-3" v-if="!isEmpty">
        <router-link v-for="item in items" :key="item.sid" class="card secret-item" :to="{
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
              {{ human(new Date(item.timestamp)) }}
            </span>
          </div>
        </router-link>
      </div>
      <div v-else>
        Storage is empty!
      </div>
      <div class="mb-4">
        <small class="text-muted">
          Secrets are saved on this device.
        </small>
      </div>
      <div class="mb-3" v-if="!isEmpty">
        <button @click="clearStorage" type="button" class="btn btn-sm btn-outline-danger">
          <BIconTrash2Fill/> <span class="span-after-icon">Clear device cache</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
// import { useStorage } from 'vue3-storage';
import Storage from '../modules/storage';
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
    const storage = new Storage();

    const isLoading = ref(false);
    const isEmpty = ref(true);
    const items = ref({});

    const clearStorage = () => {
      storage.removeAllItems('secret_');
      items.value = {};
      isEmpty.value = true;
    };

    const displayItems = () => {
      const _items = storage.getAllItems('secret_');
      items.value = _items;
      isEmpty.value = (Object.values(_items).length === 0);
      // console.log('__', items.value, isEmpty.value);
    }

    onMounted(() => {
      displayItems();
    });

    return {
      isLoading,
      isEmpty,
      clearStorage,
      human,
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
