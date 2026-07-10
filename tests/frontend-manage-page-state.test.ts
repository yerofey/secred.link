import { describe, expect, test } from 'bun:test';
import {
	getCurrentManageSecret,
	getManageIntroKeys,
} from '../apps/frontend/src/lib/manage-page-state';

describe('manage page presentation', () => {
	test('uses success framing only when a local secret exists', () => {
		expect(getManageIntroKeys(true)).toEqual({
			titleKey: 'manage.headline',
			subtitleKey: 'manage.subtitle',
		});
		expect(getManageIntroKeys(false)).toEqual({
			titleKey: 'manage.not_found_headline',
			subtitleKey: 'manage.not_found',
		});
	});

	test("treats another sid's resolved secret as loading", () => {
		const previousSecret = { accessKey: 'previous-access-key' };

		expect(
			getCurrentManageSecret('next', {
				sid: 'previous',
				secret: previousSecret,
			}),
		).toBeUndefined();
	});

	test('returns settled state only for the current sid', () => {
		const currentSecret = { accessKey: 'current-access-key' };

		expect(
			getCurrentManageSecret('current', {
				sid: 'current',
				secret: currentSecret,
			}),
		).toBe(currentSecret);
		expect(
			getCurrentManageSecret('missing', {
				sid: 'missing',
				secret: null,
			}),
		).toBeNull();
	});
});
