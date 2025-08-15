<template>
    <div class="mb-3 input-group">
        <label class="input-group-text noselect" :for="id">{{ $t('home.form.expires') }}</label>
        <select class="form-select" :id="id" :value="modelValue"
            @change="$emit('update:modelValue', Number($event.target.value))" :disabled="disabled">
            <!-- Minutes -->
            <optgroup :label="$t('expiration.minutes')">
                <option :value="5 * 60">5 {{ $t('common.minutes_5') }}</option>
                <option :value="10 * 60">10 {{ $t('common.minutes_5') }}</option>
                <option :value="30 * 60">30 {{ $t('common.minutes_5') }}</option>
            </optgroup>

            <!-- Hours -->
            <optgroup :label="$t('expiration.hours')">
                <option :value="60 * 60">1 {{ $t('common.hours_1') }}</option>
                <option :value="3 * 60 * 60">3 {{ $t('common.hours_2') }}</option>
                <option :value="6 * 60 * 60">6 {{ $t('common.hours_5') }}</option>
                <option :value="12 * 60 * 60">12 {{ $t('common.hours_5') }}</option>
                <option :value="24 * 60 * 60">24 {{ $t('common.hours_2') }}</option>
            </optgroup>

            <!-- Days -->
            <optgroup :label="$t('expiration.days')">
                <option :value="3 * 24 * 60 * 60">3 {{ $t('common.days_2') }}</option>
            </optgroup>

            <!-- Weeks -->
            <optgroup :label="$t('expiration.weeks')">
                <option :value="7 * 24 * 60 * 60">1 {{ $t('common.weeks_1') }}</option>
                <option :value="14 * 24 * 60 * 60">2 {{ $t('common.weeks_2') }}</option>
            </optgroup>

            <!-- Months -->
            <optgroup :label="$t('expiration.months')">
                <option :value="30 * 24 * 60 * 60">1 {{ $t('common.months_1') }}</option>
            </optgroup>
        </select>
    </div>
</template>

<script>
export default {
    name: 'ExpirationSelect',
    props: {
        id: {
            type: String,
            default: 'expirationSelect'
        },
        modelValue: {
            type: Number,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    created() {
        // If no expiration is selected, default to 1 month
        if (!this.modelValue) {
            this.$emit('update:modelValue', 30 * 24 * 60 * 60);
        }
    }
};
</script>

<style scoped>
.form-select {
    cursor: pointer;
}

.form-select:disabled {
    cursor: not-allowed;
    background-color: rgba(var(--bs-secondary-rgb), 0.1);
}

/* Add subtle styling to the optgroups */
::v-deep optgroup {
    font-style: normal;
    font-weight: 600;
    color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

::v-deep optgroup option {
    font-weight: normal;
    color: var(--bs-body-color);
    padding-left: 10px;
}
</style>
