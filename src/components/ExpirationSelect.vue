<template>
    <div class="mb-3 input-group">
        <label class="input-group-text noselect" :for="id">{{ $t('home.form.expires') }}</label>
        <select class="form-select" :id="id" :value="modelValue"
            @change="$emit('update:modelValue', Number($event.target.value))" :disabled="disabled">
            <!-- Minutes -->
            <optgroup :label="$t('expiration.minutes')">
                <option :value="5 * 60">5 {{ $t('common.time_units.minute.other') }}</option>
                <option :value="10 * 60">10 {{ $t('common.time_units.minute.other') }}</option>
                <option :value="30 * 60">30 {{ $t('common.time_units.minute.other') }}</option>
            </optgroup>

            <!-- Hours -->
            <optgroup :label="$t('expiration.hours')">
                <option :value="60 * 60">1 {{ $t('common.time_units.hour.one') }}</option>
                <option :value="3 * 60 * 60">3 {{ getTimeUnitForm('hour', 3) }}</option>
                <option :value="6 * 60 * 60">6 {{ getTimeUnitForm('hour', 6) }}</option>
                <option :value="12 * 60 * 60">12 {{ getTimeUnitForm('hour', 12) }}</option>
                <option :value="24 * 60 * 60">24 {{ getTimeUnitForm('hour', 24) }}</option>
            </optgroup>

            <!-- Days -->
            <optgroup :label="$t('expiration.days')">
                <option :value="3 * 24 * 60 * 60">3 {{ getTimeUnitForm('day', 3) }}</option>
            </optgroup>

            <!-- Weeks -->
            <optgroup :label="$t('expiration.weeks')">
                <option :value="7 * 24 * 60 * 60">1 {{ $t('common.time_units.week.one') }}</option>
                <option :value="14 * 24 * 60 * 60">2 {{ getTimeUnitForm('week', 2) }}</option>
            </optgroup>

            <!-- Months -->
            <optgroup :label="$t('expiration.months')">
                <option :value="30 * 24 * 60 * 60">1 {{ $t('common.time_units.month.one') }}</option>
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
			default: 'expirationSelect',
		},
		modelValue: {
			type: Number,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	created() {
		// If no expiration is selected, default to 1 month
		if (!this.modelValue) {
			this.$emit('update:modelValue', 30 * 24 * 60 * 60);
		}
	},
	methods: {
		/**
		 * Get the appropriate time unit form based on count and locale
		 * @param {string} unit - The time unit (minute, hour, day, week, month)
		 * @param {number} count - The count of units
		 * @returns {string} - Localized time unit
		 */
		getTimeUnitForm(unit, count) {
			const locale = this.$i18n.locale;

			// Special handling for Russian and similar languages with complex pluralization
			if (locale === 'ru') {
				// Russian pluralization rules
				if (count % 10 === 1 && count % 100 !== 11) {
					return this.$t(`common.time_units.${unit}.one`);
				} else if (
					[2, 3, 4].includes(count % 10) &&
					![12, 13, 14].includes(count % 100)
				) {
					return this.$t(`common.time_units.${unit}.few`);
				} else {
					return this.$t(`common.time_units.${unit}.many`);
				}
			} else {
				// Default handling for English and similar languages
				return count === 1
					? this.$t(`common.time_units.${unit}.one`)
					: this.$t(`common.time_units.${unit}.other`);
			}
		},
	},
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
:deep(optgroup) {
    font-style: normal;
    font-weight: 600;
    color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

:deep(optgroup option) {
    font-weight: normal;
    color: var(--bs-body-color);
    padding-left: 10px;
}
</style>
