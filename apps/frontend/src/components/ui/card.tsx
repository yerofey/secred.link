import type * as React from 'react';
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'editorial-surface rounded-[1.6rem] border border-border/80 bg-card text-card-foreground shadow-[0_18px_38px_hsl(var(--shadow-color)/0.08)]',
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div className={cn('flex flex-col gap-2 p-6', className)} {...props} />
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'font-semibold leading-none tracking-[-0.02em] text-foreground',
				className,
			)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
	return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
