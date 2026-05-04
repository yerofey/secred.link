import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-[0_12px_24px_hsl(var(--primary)/0.22)] hover:-translate-y-0.5 hover:bg-primary/94 hover:shadow-[0_16px_30px_hsl(var(--primary)/0.28)] active:translate-y-0 active:scale-[0.99] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
				secondary:
					'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/88 hover:shadow-md',
				outline:
					'border-border bg-surface text-foreground shadow-sm hover:-translate-y-0.5 hover:bg-accent/65 hover:text-accent-foreground hover:shadow-md active:translate-y-0',
				ghost: 'text-muted-foreground hover:bg-accent/70 hover:text-foreground',
				destructive:
					'bg-destructive text-destructive-foreground shadow-[0_14px_28px_hsl(var(--destructive)/0.2)] hover:-translate-y-0.5 hover:bg-destructive/92 hover:shadow-[0_18px_34px_hsl(var(--destructive)/0.26)] active:translate-y-0 active:scale-[0.99]',
			},
			size: {
				default: 'h-11 px-4 py-2',
				sm: 'h-9 rounded-lg px-3.5 text-xs',
				icon: 'h-11 w-11 px-0',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
