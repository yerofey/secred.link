import { describe, expect, test } from 'bun:test';
import { buildSecretOptionsSummary } from '../apps/frontend/src/lib/secret-options-summary';

const en = {
	password: 'Password',
	burn: 'Burn',
	on: 'on',
	off: 'off',
};

const ru = {
	password: 'Пароль',
	burn: 'Сжигание',
	on: 'вкл',
	off: 'выкл',
};

describe('secret options summary', () => {
	test('always states expiration and disabled protection states', () => {
		expect(
			buildSecretOptionsSummary(
				{
					expiration: '1 day',
					passwordEnabled: false,
					burnEnabled: false,
				},
				en,
			),
		).toBe('1 day · Password off · Burn off');
	});

	test('states enabled protection states in Russian', () => {
		expect(
			buildSecretOptionsSummary(
				{
					expiration: '1 день',
					passwordEnabled: true,
					burnEnabled: true,
				},
				ru,
			),
		).toBe('1 день · Пароль вкл · Сжигание вкл');
	});

	test('appends attachment size only when present', () => {
		expect(
			buildSecretOptionsSummary(
				{
					expiration: '1 day',
					passwordEnabled: false,
					burnEnabled: true,
					attachmentSize: '2.5 MB',
				},
				en,
			),
		).toBe('1 day · Password off · Burn on · 2.5 MB');
	});
});
