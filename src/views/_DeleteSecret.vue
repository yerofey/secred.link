<template>
  <div>
    <h4>Delete Secret</h4>
    <div v-if="isLoading">Loading info...</div>
    <div v-else class="form-container">
      Are you sure?
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
// import { useStorage } from 'vue3-storage';
// import {
//   BIconClipboard,
//   BIconClipboardCheck,
//   BIconTrash,
//   BIconXCircle,
// } from 'bootstrap-icons-vue';

export default {
  components: {
    // BIconClipboard,
    // BIconClipboardCheck,
    // BIconTrash,
    // BIconXCircle,
  },
  setup() {
    const route = useRoute();
    // const storage = useStorage();

    const isLoading = ref(false);

    const hash = route.hash.substring(1);
    // TODO: validate hash

    return {
      isLoading,
    };
  },
};
</script>

<style lang="scss" scoped>

</style>
