import type { ComponentPropsWithoutRef } from 'react';
import { useMemo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const rehypePlugins = [rehypeSanitize];

type MarkdownContentProps = {
	className?: string;
	children: string;
};

export function MarkdownContent({ className, children }: MarkdownContentProps) {
	const markdownComponents = useMemo<Components>(
		() => ({
			a: (props: ComponentPropsWithoutRef<'a'>) => (
				<a {...props} target="_blank" rel="noopener noreferrer" />
			),
			table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
				<div className="my-3 w-full overflow-x-auto rounded-xl border border-border/90 bg-surface-muted/25">
					<table
						className="w-full min-w-[min(100%,36rem)] border-collapse text-left text-sm"
						{...props}
					>
						{children}
					</table>
				</div>
			),
			thead: (props: ComponentPropsWithoutRef<'thead'>) => (
				<thead className="border-b border-border bg-muted/45" {...props} />
			),
			th: (props: ComponentPropsWithoutRef<'th'>) => (
				<th
					className="border-r border-border/80 px-3 py-2 font-semibold last:border-r-0"
					{...props}
				/>
			),
			td: (props: ComponentPropsWithoutRef<'td'>) => (
				<td
					className="border-r border-border/50 px-3 py-2 align-top last:border-r-0"
					{...props}
				/>
			),
			tr: (props: ComponentPropsWithoutRef<'tr'>) => (
				<tr className="border-b border-border/45 last:border-b-0" {...props} />
			),
			ul: ({ className, ...props }: ComponentPropsWithoutRef<'ul'>) => (
				<ul
					className={cn(
						'my-2 pl-5 [&_ul]:my-1',
						className?.includes('contains-task-list')
							? 'list-none pl-1'
							: 'list-disc',
						className,
					)}
					{...props}
				/>
			),
			ol: ({ className, ...props }: ComponentPropsWithoutRef<'ol'>) => (
				<ol
					className={cn(
						'my-2 list-decimal pl-5 [&_ol]:my-1',
						className?.includes('contains-task-list') && 'list-none pl-1',
						className,
					)}
					{...props}
				/>
			),
			li: ({ className, ...props }: ComponentPropsWithoutRef<'li'>) => (
				<li
					className={cn(
						'my-0.5',
						className?.includes('task-list-item') &&
							'flex list-none items-start gap-2 py-0.5 [&>input]:mt-1',
						className,
					)}
					{...props}
				/>
			),
			del: (props: ComponentPropsWithoutRef<'del'>) => (
				<del className="text-muted-foreground line-through" {...props} />
			),
		}),
		[],
	);

	return (
		<div
			className={cn(
				'markdown-content break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere] [&_a]:break-all [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-md [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_ul]:list-disc [&_ul]:pl-5 [&_hr]:my-6 [&_hr]:border-border',
				className,
			)}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={rehypePlugins}
				components={markdownComponents}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}
