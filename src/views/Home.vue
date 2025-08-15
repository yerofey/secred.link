<template>
  <form class="form-container" @submit.prevent="processForm">
    <div v-if="apiStatus === 'error'" class="alert alert-danger mb-4" role="alert">
      <strong>{{ $t('common.error') }}:</strong> {{ apiStatusMessage || $t('home.api.unavailable') }}
    </div>
    <div class="mb-4">
      <h5>{{ $t('home.title') }}</h5>
      <h6>{{ $t('home.subtitle') }}</h6>
    </div>
    <div class="d-flex">
      <textarea class="form-control" maxlength="4096" rows="6" :placeholder="`${$t('home.form.insert')}...`"
        autocorrect="off" v-model="secretContent"></textarea>
    </div>
    <div class="d-flex mt-2">
      <button type="button" class="btn options-toggle w-100 d-flex justify-content-between align-items-center"
        @click="toggleOptions">
        <span>{{ $t('home.form.optional') }}</span>
        <span class="toggle-icon">
          <BIconChevronUp v-if="showOptions" />
          <BIconChevronDown v-else />
        </span>
      </button>
    </div>

    <transition name="collapse">
      <div v-show="showOptions" class="group-optional">
        <div class="mb-3 input-group">
          <label class="input-group-text noselect" for="inputGroupSelect01">{{ $t('home.form.password') }}</label>
          <input type="text" class="form-control" id="inputGroupSelect01" :placeholder="`${$t('home.form.passphrase')}`"
            autocomplete="off" maxlength="64" v-model="secretPassword" />
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
    </transition>

    <div class="mt-4 form-buttons">
      <button @click="processForm" type="button" class="btn btn-primary btn-lg submit-button" :class="{
        'is-loading': submitInProcess,
      }" :disabled="!submitIsEnabled || apiStatus === 'error'">
        <BIconPlusCircleFill />&nbsp;<span class="span-after-icon">{{ submitInProcess ? `${$t('home.form.creating')}...`
          : $t('home.form.create') }}</span>
      </button>
    </div>
  </form>
</template>

<script>
import { inject, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSecretForm } from '../modules/secretFormProcessor';
import { useApiHealth } from '../modules/apiHealth';
import { BIconPlusCircleFill, BIconChevronUp, BIconChevronDown } from 'bootstrap-icons-vue';

export default {
  components: {
    BIconPlusCircleFill,
    BIconChevronUp,
    BIconChevronDown,
  },
  setup() {
    const cryptojs = inject('cryptojs');
    const router = useRouter();

    // Options toggle state
    const showOptions = ref(false);
    const toggleOptions = () => {
      showOptions.value = !showOptions.value;
    };

    // Use the extracted form processor module
    const {
      submitIsEnabled,
      submitInProcess,
      secretContent,
      secretPassword,
      secretLifetime,
      secretIsBurnable,
      processForm,
    } = useSecretForm({ cryptojs, router });

    // API health check
    const { apiStatus, apiStatusMessage, apiReady, checkApiHealth } = useApiHealth();
    
    onMounted(() => {
      checkApiHealth();
    });

    return {
      submitIsEnabled,
      submitInProcess,
      secretContent,
      secretPassword,
      secretLifetime,
      secretIsBurnable,
      processForm,
      showOptions,
      toggleOptions,
      apiStatus,
      apiStatusMessage,
      apiReady,
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
    padding: 10px;
    margin-top: 3px;
    border-radius: 8px;
    background-color: rgba(var(--bs-secondary-rgb), 0.05);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

  .options-toggle {
    background-color: transparent;
    border: none;
    color: var(--bs-body-color);
    font-size: 0.9rem;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    
    &:hover, &:focus {
      background-color: rgba(var(--bs-secondary-rgb), 0.1);
    }
    
    &:active {
      background-color: rgba(var(--bs-secondary-rgb), 0.2);
    }
  }

  .toggle-icon {
    display: inline-flex;
    align-items: center;
    opacity: 0.7;
  }
}

// Animation for collapsible section
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
