import { buildCreateSecretPayload } from '@secred/shared';

type WorkerGlobal = typeof globalThis & {
	postMessage(message: unknown, transfer?: Transferable[]): void;
};

const w = globalThis as unknown as WorkerGlobal;

type BuildPayload = {
	text: string;
	password: string;
	lifetime: number;
	isBurnable: boolean;
	versionPrefix: string;
	testString: string;
	attachment?: { buffer: ArrayBuffer; name: string; mime: string };
};

type Incoming = { id: number; payload: BuildPayload };

w.onmessage = async (ev: MessageEvent<Incoming>) => {
	const { id, payload } = ev.data;
	try {
		const attachment = payload.attachment
			? {
					bytes: new Uint8Array(payload.attachment.buffer),
					name: payload.attachment.name,
					mime: payload.attachment.mime,
				}
			: undefined;
		const t0 = performance.now();
		const result = await buildCreateSecretPayload({
			text: payload.text,
			password: payload.password,
			lifetime: payload.lifetime,
			isBurnable: payload.isBurnable,
			versionPrefix: payload.versionPrefix,
			testString: payload.testString,
			attachment,
		});
		if (import.meta.env.DEV) {
			console.debug(
				'[secred/worker] buildCreateSecretPayload',
				`${(performance.now() - t0).toFixed(0)}ms`,
			);
		}

		const u8 = result.attachmentCipher;
		const attachmentCipherBuffer =
			u8 &&
			(u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength
				? u8.buffer
				: u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength));

		const transfer: Transferable[] = [];
		if (attachmentCipherBuffer) {
			transfer.push(attachmentCipherBuffer);
		}

		w.postMessage(
			{
				id,
				ok: true as const,
				request: result.request,
				accessKey: result.accessKey,
				manageKey: result.manageKey,
				sid: result.sid,
				localSecret: result.localSecret,
				attachmentUploadToken: result.attachmentUploadToken,
				attachmentCipherBuffer,
			},
			transfer,
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		w.postMessage({ id, ok: false as const, error: message });
	}
};
