import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				rewrite: path => path.replace(/^\/api/, ''),
			},
			'/socket.io': 'http://localhost:3000/socket.io',
		},
	},
	build: {
		sourcemap: true,
	},
	plugins: [sveltekit()],
});
