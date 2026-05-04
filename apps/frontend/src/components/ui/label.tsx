import type * as React from 'react';
import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: Generic shadcn-style label receives htmlFor from callers.
		<label
			className={cn(
				'text-sm font-semibold leading-none tracking-[-0.01em] text-foreground',
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
