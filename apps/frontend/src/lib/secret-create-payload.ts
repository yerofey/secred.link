import {
	buildCreateSecretPayload,
	DEFAULT_TEST_STRING,
	DEFAULT_VERSION_PREFIX,
} from '@secred/shared';

type BuildInput = Parameters<typeof buildCreateSecretPayload>[0];
type BuildResult = Awaited<ReturnType<typeof buildCreateSecretPayload>>;

type WorkerBuildPayload = {
	text: string;
	password: string;
	lifetime: number;
	isBurnable: boolean;
	versionPrefix: string;
	testString: string;
	attachment?: { buffer: ArrayBuffer; name: string; mime: string };
};

type WorkerOk = {
	id: number;
	ok: true;
	request: BuildResult['request'];
	accessKey: string;
	manageKey: string;
	sid: string;
	localSecret: BuildResult['localSecret'];
	attachmentUploadToken?: string;
	attachmentCipherBuffer?: ArrayBuffer;
};

type WorkerErr = { id: number; ok: false; error: string };

let worker: Worker | null = null;
let requestSeq = 0;

function getCryptoWorker(): Worker | null {
	if (typeof Worker === 'undefined') {
		return null;
	}
	if (!worker) {
		try {
			worker = new Worker(
				new URL('../workers/secret-create.worker.ts', import.meta.url),
				{ type: 'module' },
			);
		} catch {
			return null;
		}
	}
	return worker;
}

function postToWorker(
	w: Worker,
	id: number,
	payload: WorkerBuildPayload,
	transfer: Transferable[],
): Promise<BuildResult> {
	return new Promise((resolve, reject) => {
		const onMessage = (ev: MessageEvent<WorkerOk | WorkerErr>) => {
			if (ev.data.id !== id) {
				return;
			}
			w.removeEventListener('message', onMessage);
			const data = ev.data;
			if (!data.ok) {
				reject(new Error(data.error));
				return;
			}
			resolve({
				request: data.request,
				accessKey: data.accessKey,
				manageKey: data.manageKey,
				sid: data.sid,
				localSecret: data.localSecret,
				attachmentUploadToken: data.attachmentUploadToken,
				attachmentCipher: data.attachmentCipherBuffer
					? new Uint8Array(data.attachmentCipherBuffer)
					: undefined,
			});
		};
		w.addEventListener('message', onMessage);
		w.postMessage({ id, payload }, transfer);
	});
}

/**
 * Runs `buildCreateSecretPayload` in a dedicated worker when available so the UI thread stays responsive.
 * Falls back to the main thread if workers are missing or the worker fails (re-reads `attachmentFile` when the input buffer was transferred).
 */
export async function buildCreateSecretPayloadForSubmit(
	input: BuildInput,
	options: { attachmentFile: File | null },
): Promise<BuildResult> {
	const w = getCryptoWorker();
	if (!w) {
		return buildCreateSecretPayload(input);
	}

	const id = ++requestSeq;
	const transfer: Transferable[] = [];
	let payload: WorkerBuildPayload;

	if (input.attachment) {
		const u8 = input.attachment.bytes;
		const buf: ArrayBuffer = (
			u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength
				? u8.buffer
				: u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
		) as ArrayBuffer;
		transfer.push(buf);
		payload = {
			text: input.text,
			password: input.password,
			lifetime: input.lifetime,
			isBurnable: input.isBurnable,
			versionPrefix: input.versionPrefix ?? DEFAULT_VERSION_PREFIX,
			testString: input.testString ?? DEFAULT_TEST_STRING,
			attachment: {
				buffer: buf,
				name: input.attachment.name,
				mime: input.attachment.mime,
			},
		};
	} else {
		payload = {
			text: input.text,
			password: input.password,
			lifetime: input.lifetime,
			isBurnable: input.isBurnable,
			versionPrefix: input.versionPrefix ?? DEFAULT_VERSION_PREFIX,
			testString: input.testString ?? DEFAULT_TEST_STRING,
		};
	}

	try {
		return await postToWorker(w, id, payload, transfer);
	} catch (err) {
		if (import.meta.env.DEV) {
			console.warn(
				'[secred] worker crypto failed, falling back to main thread',
				err,
			);
		}
		if (input.attachment && options.attachmentFile) {
			const buffer = await options.attachmentFile.arrayBuffer();
			return buildCreateSecretPayload({
				...input,
				attachment: {
					bytes: new Uint8Array(buffer),
					name: input.attachment.name,
					mime: input.attachment.mime,
				},
			});
		}
		return buildCreateSecretPayload(input);
	}
}
