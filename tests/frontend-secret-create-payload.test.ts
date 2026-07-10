import { describe, expect, test } from 'bun:test';
import { createHomeSubmitBindings } from '../apps/frontend/src/lib/home-submit-bindings';
import { buildCreateSecretPayloadForSubmit } from '../apps/frontend/src/lib/secret-create-payload';

describe('secret create payload retries', () => {
	test('routes form submit and retry through the same fresh attempt path', async () => {
		const input = {
			text: 'retry payload',
			password: 'retry password',
			lifetime: 3600,
			isBurnable: false,
		};
		const payloads: Awaited<
			ReturnType<typeof buildCreateSecretPayloadForSubmit>
		>[] = [];
		const submit = async () => {
			payloads.push(
				await buildCreateSecretPayloadForSubmit(input, {
					attachmentFile: null,
				}),
			);
		};
		const bindings = createHomeSubmitBindings(submit);

		expect(bindings.onRetrySubmit).toBe(bindings.onSubmit);
		await bindings.onSubmit();
		await bindings.onRetrySubmit();

		expect(payloads).toHaveLength(2);
		expect(payloads[1]?.sid).not.toBe(payloads[0]?.sid);
		expect(payloads[1]?.accessKey).not.toBe(payloads[0]?.accessKey);
		expect(payloads[1]?.manageKey).not.toBe(payloads[0]?.manageKey);
	});
});
