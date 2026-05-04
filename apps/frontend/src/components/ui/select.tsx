import type * as React from 'react';
import { cn } from '@/lib/utils';

function Select({ className, ...props }: React.ComponentProps<'select'>) {
	return (
		<select
			className={cn(
				'flex h-12 w-full rounded-xl border border-input bg-surface px-4 py-3 text-base text-foreground shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				className,
			)}
			{...props}
		/>
	);
}

export { Select };
