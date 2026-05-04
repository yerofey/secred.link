import type * as React from 'react';
import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type="checkbox"
			className={cn(
				'h-4 w-4 rounded-[0.4rem] border border-input bg-surface accent-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
				className,
			)}
			{...props}
		/>
	);
}

export { Checkbox };
