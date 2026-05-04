import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'postcss';
import type { UserConfig } from 'vite';

const config = {
	plugins: [react()],
	build: {
		chunkSizeWarningLimit: 550,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes('node_modules')) {
						return undefined;
					}
					if (id.includes('/react/') || id.includes('/react-dom/')) {
						return 'react-vendor';
					}
					if (
						id.includes('/react-router/') ||
						id.includes('/react-router-dom/')
					) {
						return 'router-vendor';
					}
					if (id.includes('/lucide-react/')) {
						return 'icons-vendor';
					}
					if (id.includes('/prosemirror-')) {
						return 'prosemirror-vendor';
					}
					if (id.includes('/@tiptap/')) {
						return 'tiptap-vendor';
					}
					if (id.includes('/marked/')) {
						return 'marked-vendor';
					}
					if (
						id.includes('/react-markdown/') ||
						id.includes('/rehype-sanitize/') ||
						id.includes('/remark-gfm/')
					) {
						return 'react-md-vendor';
					}
					if (
						id.includes('/remark-') ||
						id.includes('/rehype-') ||
						id.includes('/micromark') ||
						id.includes('/unified/') ||
						id.includes('/mdast-') ||
						id.includes('/hast-') ||
						id.includes('/unist') ||
						id.includes('/vfile') ||
						id.includes('/trim-lines') ||
						id.includes('/decode-named-character-reference')
					) {
						return 'mdast-vendor';
					}
					return 'vendor';
				},
			},
		},
	},
	css: {
		postcss: {
			plugins: [tailwindcss as unknown as Plugin],
		},
	},
	publicDir: resolve(__dirname, '../../public'),
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@secred/shared': resolve(__dirname, '../../packages/shared/src'),
		},
	},
} satisfies UserConfig;

export default config;
