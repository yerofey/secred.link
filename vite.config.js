import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			reactivityTransform: true,
		}),
		legacy({
			targets: ['defaults', 'not IE 11', '> 0.5%', 'Firefox ESR', 'not dead'],
			modernPolyfills: true,
		}),
		VueI18nPlugin({
			include: resolve(
				dirname(fileURLToPath(import.meta.url)),
				'./src/locales/**',
			),
			runtimeOnly: false,
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
		extensions: ['.js', '.json', '.vue'],
	},
});
