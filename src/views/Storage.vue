<template>
  <div>
    <h4>{{ $t('storage.title') }}</h4>
    <div v-if="isLoading" class="mt-4">{{ $t('common.loading') }}...</div>
    <div v-else class="form-container mt-4">
      <div class="secret-items mb-3" v-if="!isEmpty">
        <router-link v-for="item in items" :key="item.sid" class="card secret-item" :to="{
            name: 'view',
            hash: `#${item.keys.accessKey}`,
          }">
          <div class="card-body">
            <div class="card-title secret-title">
              <!-- {{ `${(item.isOwner ? 'Your' : 'Added')} ` }} -->
              {{ $t('common.secret') }}
            </div>
            <p class="card-text secret-info text-muted">
              <div v-if="item.hasPassword">
                <BIconLockFill/> {{ $t('storage.protected') }}
              </div>
              <div v-else>
                <BIconUnlockFill/> {{ $t('storage.not_protected') }}
              </div>
            </p>
            <span class="secret-date">
              {{ human(new Date(item.timestamp)) }}
            </span>
          </div>
        </router-link>
      </div>
      <div v-else>
        {{ $t('storage.empty') }}!
      </div>
      <div class="mb-4">
        <small class="text-muted">
          {{ $t('storage.on_device') }}.
        </small>
      </div>
      <div class="mb-3" v-if="!isEmpty">
        <button @click="clearStorage" type="button" class="btn btn-sm button">
          <BIconTrash2Fill/> <span class="span-after-icon">{{ $t('storage.clean') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import {
	BIconLockFill,
	BIconTrash2Fill,
	BIconUnlockFill,
} from 'bootstrap-icons-vue';
import human from 'human-time';
import { onMounted, ref } from 'vue';
import Storage from '../modules/storage';

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
			// get all items from storage
			const _items = storage.getAllItems('secret_');
			// sort by timestamp
			const sortedItemsKeys = Object.keys(_items).sort(
				(keyA, keyB) => _items[keyB].timestamp - _items[keyA].timestamp,
			);
			const sortedItems = {};
			for (const key of sortedItemsKeys) {
				sortedItems[key] = _items[key];
			}
			// fill values
			items.value = sortedItems;
			// console.log('items', sortedItems);
			isEmpty.value = Object.values(_items).length === 0;
		};

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
  flex-flow: row wrap;
  align-content: flex-start;
  justify-content: center;


  .secret-item {
    margin: 7px;
    display: flex;
    max-width: 170px;
    min-width: 170px;
    flex-direction: column;
    background-color: var(--app-secondary-bg);
    box-shadow: 0 0 24px -8px var(--app-secondary-bg);

    color: var(--bs-emphasis-color);
    text-decoration: none;


    .secret-title {
      margin-bottom: 0;
    }

    .secret-info {
      margin-top: 3px;
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
