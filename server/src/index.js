const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const getRedisClient = require('./redis');
const { generateKeys, encryptData, decryptData } = require('./encryption');

require('dotenv').config();

// Toggle for resetting chat history
const RESET = true;

// Used for end to end encryption
const keys = {
	publicKey: '',
	privateKey: '',
};

let redisClient;

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const HOST_NAME = process.env.HOSTNAME || 'Server';

app.get('/server-name', (req, res) => {
	res.status(200).send(HOST_NAME);
});

app.get('/test', (req, res) => {
	res.status(200).send('Server is running! 🚀');
});

const API_KEY_PASSWORD = process.env.API_KEY_PASSWORD || 'api-password';
const API_KEY = process.env.API_KEY || '194b01740bd8ae752ed224917feb21e98955c685a63a50302ea5b42fa2a0528d';

app.post('/login', (req, res) => {
	const { password } = req.body;

	if (password !== API_KEY_PASSWORD) {
		res.status(401).send('Unauthorized');
		return;
	}

	res.status(200).send({
		apiKey: API_KEY,
	});
});

// Start socket.io server
const io = new Server(server);

// Handle socket connections
io.on('connection', async socket => {
	// Check if user has API_KEY
	if (!socket.handshake.auth.api_key || socket.handshake.auth.api_key !== API_KEY) {
		socket.disconnect();
		return;
	}

	// Set new user
	const username = socket.handshake.query.username;

	// Handle new user
	await newUser(socket.id, username);

	// Send public key to client so they can encrypt messages
	socket.emit('keys', {
		publicKey: keys.publicKey,
	});

	console.log('A user connected! 🎉');

	// Handle chat messages
	socket.on('chat-message', async data => {
		// Get all messages
		const messages = JSON.parse((await redisClient.get('messages')) || '[]');

		// Decrypt message
		const message = decryptData(data, keys.privateKey);

		// Add new message
		messages.push({
			client: socket.id,
			message: message,
			timestamp: new Date().toISOString(),
		});

		// Save messages to redis
		await redisClient.set('messages', JSON.stringify(messages));

		// Send update to all users
		sendUpdate(socket.id);
	});

	// Handle disconnect
	socket.on('disconnect', async () => {
		// Get clients from redis
		const clientsStr = (await redisClient.get('clients')) || '[]';
		const clients = JSON.parse(clientsStr);

		// Set user offline
		const index = clients.findIndex(client => client.id === socket.id);

		if (index !== -1) {
			clients[index].online = false;
		}

		// Save clients to redis
		redisClient.set('clients', JSON.stringify(clients));

		// Send update to all users
		sendUpdate(socket.id);

		console.log('A user disconnected! 😢');
	});

	async function newUser(id, username) {
		// Create new user object
		const newClient = {
			id,
			username,
			online: true,
		};

		// Get clients from redis
		const clients = JSON.parse((await redisClient.get('clients')) || '[]');

		// If client does not exist, add them
		if (!clients.some(client => id === client.id)) {
			// If username already exists remove it
			const index = clients.findIndex(client => client.username === username);

			if (index !== -1) {
				// Remove and get old client
				const [oldClient] = clients.splice(index, 1);

				// And map all messages from this user to the new user
				const messages = JSON.parse((await redisClient.get('messages')) || '[]');

				for (let i = 0; i < messages.length; i++) {
					if (messages[i].client === oldClient.id) {
						messages[i].client = newClient.id;
					}
				}

				// Save messages to redis
				await redisClient.set('messages', JSON.stringify(messages));
			}

			// Add new client
			clients.push(newClient);

			// Save clients to redis
			await redisClient.set('clients', JSON.stringify(Array.from(clients)));
		}

		// Send update to all clients
		sendUpdate(id);
	}

	// Send update to all clients
	async function sendUpdate() {
		// Get all client data and messages
		const clients = JSON.parse((await redisClient.get('clients')) || '[]');
		const messages = JSON.parse((await redisClient.get('messages')) || '[]');

		// Send data to client
		const data = {
			clients: clients,
			messages,
		};

		const sockets = io.sockets.sockets;

		for (let [id, socket] of sockets) {
			// The only way to deep copy an object in javascript (needed for encryption)
			const dataCopy = JSON.parse(JSON.stringify(data));

			// Encrypt message
			for (let i = 0; i < dataCopy.messages.length; i++) {
				dataCopy.messages[i].message = await encryptData(
					dataCopy.messages[i].message,
					socket.handshake.auth.public_key,
				);
			}

			// Send data to client
			socket.emit('socket-update', dataCopy);
		}
	}
});

// Start server
const port = process.env.PORT || 3000;

server.listen(port, async () => {
	console.log(`Running on port ${port} 🚀`);

	// Generate keys
	const { publicKey, privateKey } = generateKeys();
	keys.publicKey = publicKey;
	keys.privateKey = privateKey;

	console.log('Keys generated! 🔑');

	// Connect to redis
	redisClient = await getRedisClient();

	// Reset chat history
	if (RESET) {
		await redisClient.set('messages', JSON.stringify([]));
		await redisClient.set('clients', JSON.stringify([]));
	}

	console.log('Redis connected! 💾');
});
