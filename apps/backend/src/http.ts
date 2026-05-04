export const json = (body: unknown, init: ResponseInit = {}) =>
	new Response(JSON.stringify(body), {
		...init,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...init.headers,
		},
	});

export const notFound = () =>
	json({ error: 'Resource not found' }, { status: 404 });

export const badRequest = (error: unknown) => json({ error }, { status: 400 });

export const unauthorized = () =>
	json({ error: 'Unauthorized' }, { status: 401 });
