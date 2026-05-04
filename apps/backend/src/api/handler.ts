import {
	ApiInner,
	ApiValidationMessage,
	type CreateSecretResponse,
	createSecretSchema,
	type DeleteSecretResponse,
	type GetSecretResponse,
	getApiInnerPath,
	type HealthResponse,
	HttpHeader,
	importSecretSchema,
	type MetricsCounter,
	type MetricsResponse,
	parseAttachmentRoute,
	parseSecretDeleteRoute,
	parseSecretGetRoute,
	validateHash,
} from '@secred/shared';
import type { Env } from '../env';
import { badRequest, json, notFound, unauthorized } from '../http';

const metricsStub = (env: Env) =>
	env.METRICS.get(env.METRICS.idFromName('global'));

const secretStub = (env: Env, accessKey: string) =>
	env.SECRETS.get(env.SECRETS.idFromName(accessKey));

const incrementMetric = (
	env: Env,
	ctx: ExecutionContext,
	key: MetricsCounter,
) => {
	ctx.waitUntil(metricsStub(env).increment(key));
};

export const handleApi = async (
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) => {
	const url = new URL(request.url);
	const path = getApiInnerPath(url.pathname);

	if (request.method === 'GET' && path === ApiInner.health) {
		const version = Number.parseInt(env.VERSION_PREFIX, 10);
		const body: HealthResponse = {
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: Number.isFinite(version) ? version : 0,
			environment: env.ENVIRONMENT,
		};
		return json(body);
	}

	if (request.method === 'POST' && path === ApiInner.secrets) {
		const parsed = createSecretSchema.safeParse(
			await request.json().catch(() => null),
		);
		if (!parsed.success) {
			return badRequest(parsed.error.flatten());
		}
		const result = await secretStub(env, parsed.data.accessKey).create(
			parsed.data,
		);
		if (result.status === 'exists') {
			return json({ error: 'Secret already exists' }, { status: 409 });
		}
		incrementMetric(env, ctx, 'created');
		const body: CreateSecretResponse = { data: { success: true } };
		return json(body, { status: 201 });
	}

	const attachmentRoute = parseAttachmentRoute(path);
	if (attachmentRoute && request.method === 'PUT') {
		const accessKey = attachmentRoute.accessKeyHash;
		if (!validateHash(accessKey)) {
			return badRequest(ApiValidationMessage.hashAccessKey);
		}
		const token = request.headers.get(HttpHeader.UploadToken) ?? '';
		if (!token) {
			return badRequest(ApiValidationMessage.missingUploadToken);
		}
		const body = await request.arrayBuffer();
		const result = await secretStub(env, accessKey).uploadAttachment(
			token,
			body,
		);
		if (result.status === 'unauthorized') {
			return unauthorized();
		}
		if (result.status !== 'ok') {
			return badRequest('attachment upload failed');
		}
		return new Response(null, { status: 204 });
	}

	if (attachmentRoute && request.method === 'GET') {
		const accessKey = attachmentRoute.accessKeyHash;
		if (!validateHash(accessKey)) {
			return badRequest(ApiValidationMessage.hashAccessKey);
		}
		const burnToken = url.searchParams.get('burnToken') ?? undefined;
		const result = await secretStub(env, accessKey).getAttachment(burnToken);
		if (result.status === 'unauthorized') {
			return unauthorized();
		}
		if (result.status !== 'ok' && result.status !== 'ok_burned') {
			return notFound();
		}
		if (result.status === 'ok_burned') {
			incrementMetric(env, ctx, 'burned');
		}
		return new Response(result.body, {
			headers: {
				'content-type': 'application/octet-stream',
				'cache-control': 'no-store',
			},
		});
	}

	const secretGet = parseSecretGetRoute(path);
	if (request.method === 'GET' && secretGet) {
		const accessKey = secretGet.accessKeyHash;
		if (!validateHash(accessKey)) {
			return badRequest(ApiValidationMessage.hashAccessKey);
		}
		const result = await secretStub(env, accessKey).get();
		if (result.status === 'expired') {
			incrementMetric(env, ctx, 'expired');
			return notFound();
		}
		if (result.status !== 'found') {
			return notFound();
		}
		incrementMetric(env, ctx, 'requested');
		if (result.isBurned) {
			incrementMetric(env, ctx, 'burned');
		}
		const body: GetSecretResponse = {
			data: result.data,
			isBurned: result.isBurned,
			attachmentBurnToken: result.attachmentBurnToken,
		};
		return json(body);
	}

	const secretDelete = parseSecretDeleteRoute(path);
	if (request.method === 'DELETE' && secretDelete) {
		const { accessKeyHash: accessKey, manageKeyHash: manageKey } = secretDelete;
		if (!validateHash(accessKey) || !validateHash(manageKey)) {
			return badRequest(ApiValidationMessage.hashAccessAndManageKey);
		}
		const result = await secretStub(env, accessKey).delete(manageKey);
		if (result.status !== 'deleted') {
			return notFound();
		}
		incrementMetric(env, ctx, 'deleted');
		const body: DeleteSecretResponse = { data: { success: true } };
		return json(body);
	}

	if (request.method === 'GET' && path === ApiInner.metrics) {
		if (!env.METRICS_TOKEN) {
			return notFound();
		}
		if (
			request.headers.get(HttpHeader.Authorization) !==
			`Bearer ${env.METRICS_TOKEN}`
		) {
			return unauthorized();
		}
		const start = Date.now();
		const body: MetricsResponse = {
			data: {
				counters: await metricsStub(env).all(),
			},
			meta: {
				elapsed: Date.now() - start,
				timestamp: Math.round(Date.now() / 1000),
			},
		};
		return json(body);
	}

	if (request.method === 'POST' && path === ApiInner.migrationSecrets) {
		if (!env.MIGRATION_TOKEN) {
			return notFound();
		}
		if (
			request.headers.get(HttpHeader.Authorization) !==
			`Bearer ${env.MIGRATION_TOKEN}`
		) {
			return unauthorized();
		}
		const parsed = importSecretSchema.safeParse(
			await request.json().catch(() => null),
		);
		if (!parsed.success) {
			return badRequest(parsed.error.flatten());
		}
		if (new Date(parsed.data.expires_at).getTime() <= Date.now()) {
			return json(
				{ data: { imported: false, reason: 'expired' } },
				{ status: 202 },
			);
		}
		const result = await secretStub(env, parsed.data.access_key).importSecret(
			parsed.data,
		);
		if (result.status === 'exists') {
			return json(
				{ data: { imported: false, reason: 'exists' } },
				{ status: 409 },
			);
		}
		incrementMetric(env, ctx, 'migration_imported');
		return json({ data: { imported: true } }, { status: 201 });
	}

	return notFound();
};
