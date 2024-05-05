import { io } from 'socket.io-client';
import { writable } from 'svelte/store';
import { decryptData, generateKeys } from './encryption';

export class SocketClient {
	socket;
	keys = {
		publicKey: '',
		privateKey: '',
		serverPublicKey: '',
	};

	store = null;

	constructor() {
		this.store = writable({
			messages: [],
			totalUsers: [],
			onlineUsers: [],
		});
	}

	async init() {
		await this.initKeys();
		await this.initSocket();
	}

	async initSocket() {
		return new Promise((resolve, reject) => {
			// Connect to socket
			this.socket = io('/', {
				query: {
					// Send username as query
					username: localStorage.getItem('username'),
				},
				auth: {
					// Send public key and api key as headers
					public_key: this.keys.publicKey,
					api_key: localStorage.getItem('apiKey'),
				},
			});

			// Receive public key from server
			this.socket.on('keys', data => {
				this.keys.serverPublicKey = data.publicKey;
				resolve();
			});

			// Handle errors
			this.socket.on('connect_error', error => {
				reject(error);
			});

			// Receive messages from server
			this.socket.on('socket-update', async data => {
				// Iterate over messages to decrypt message text
				for (let i = 0; i < data.messages.length; i++) {
					const message = data.messages[i];

					// Decrypt message text
					const decryptedMessage = await decryptData(message.message, this.keys.privateKey);
					data.messages[i].message = decryptedMessage;

					// Convert client id to username
					data.messages[i].client =
						data.clients.find(client => client.id === message.client)?.username || message.client;
				}

				const messages = data.messages;
				messages.reverse();

				// Set data to client
				this.store.update(() => ({
					messages,
					totalUsers: data.clients,
					onlineUsers: data.clients.filter(client => client.online),
				}));
			});

			window.addEventListener('beforeunload', () => {
				socket.disconnect();
			});
		});
	}

	async initKeys() {
		// If keys not set, generate new ones
		if (localStorage.getItem('publicKey') === null || localStorage.getItem('privateKey') === null) {
			// Generate new keys
			const { publicKey, privateKey } = await generateKeys();

			// Save keys to local storage
			localStorage.setItem('publicKey', publicKey);
			localStorage.setItem('privateKey', privateKey);

			// Set keys
			this.keys.publicKey = publicKey;
			this.keys.privateKey = privateKey;
		} else {
			// Set keys
			this.keys.publicKey = localStorage.getItem('publicKey');
			this.keys.privateKey = localStorage.getItem('privateKey');
		}
	}
}
