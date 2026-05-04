import { type ComponentType, lazy } from 'react';

export function lazyPage<P extends object>(
	loader: () => Promise<Record<string, ComponentType<P>>>,
	exportName: string,
) {
	return lazy(async () => {
		const module = await loader();
		const Component = module[exportName];
		return { default: Component };
	});
}
