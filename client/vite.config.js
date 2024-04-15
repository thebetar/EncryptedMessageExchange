import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/socket.io': 'http://localhost:3000/socket.io',
		},
	},
	plugins: [sveltekit()],
});
