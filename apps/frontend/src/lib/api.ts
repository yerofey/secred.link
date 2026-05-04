import {
	apiUrl,
	type CreateSecretRequest,
	type CreateSecretResponse,
	type DeleteSecretResponse,
	type GetSecretResponse,
	type HealthResponse,
	HttpHeader,
	type MetricsResponse,
} from '@secred/shared';

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
	const response = await fetch(input, {
		...init,
		headers: {
			'content-type': 'application/json',
			...init?.headers,
		},
	});
	if (!response.ok) {
		throw new Error(`Request failed with ${response.status}`);
	}
	return (await response.json()) as T;
};

export const api = {
	health: () => requestJson<HealthResponse>(apiUrl.health()),
	createSecret: (body: CreateSecretRequest) =>
		requestJson<CreateSecretResponse>(apiUrl.secrets(), {
			method: 'POST',
			body: JSON.stringify(body),
		}),
	uploadSecretAttachment: async (
		accessKeyHash: string,
		uploadToken: string,
		body: Uint8Array,
	) => {
		const payload = new Uint8Array(body.byteLength);
		payload.set(body);
		const response = await fetch(apiUrl.attachment(accessKeyHash), {
			method: 'PUT',
			headers: {
				[HttpHeader.UploadToken]: uploadToken,
			},
			body: payload,
		});
		if (!response.ok) {
			throw new Error(`Attachment upload failed with ${response.status}`);
		}
	},
	getSecretAttachment: async (accessKeyHash: string, burnToken?: string) => {
		const response = await fetch(apiUrl.attachment(accessKeyHash, burnToken));
		if (!response.ok) {
			throw new Error(`Attachment download failed with ${response.status}`);
		}
		return response.arrayBuffer();
	},
	getSecret: (accessKeyHash: string) =>
		requestJson<GetSecretResponse>(apiUrl.secret(accessKeyHash)),
	deleteSecret: (accessKeyHash: string, manageKeyHash: string) =>
		requestJson<DeleteSecretResponse>(
			apiUrl.deleteSecret(accessKeyHash, manageKeyHash),
			{
				method: 'DELETE',
			},
		),
	metrics: () => requestJson<MetricsResponse>(apiUrl.metrics()),
};
