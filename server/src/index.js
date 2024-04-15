const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const getRedisClient = require('./redis');

const app = express();

app.use(cors());

const server = createServer(app);

const io = new Server(server);

let redisClient;

app.get('/test', (req, res) => {
	res.send('Server is running! 🚀');
});

let clients = 0;
let clientsIdMap = {};

const RESET = false;

io.on('connection', async socket => {
	clients++;

	sendUpdate();

	if (RESET) {
		await redisClient.set('messages', JSON.stringify([]));
		await redisClient.set('clients', JSON.stringify([]));
	}

	console.log('A user connected! 🎉');

	socket.on('new-user', async username => {
		const clients = JSON.parse((await redisClient.get('clients')) || '[]');

		const clientsSet = new Set(clients);
		clientsSet.add(username);

		await redisClient.set('clients', JSON.stringify(Array.from(clientsSet)));

		clientsIdMap[socket.id] = username;

		sendUpdate();
	});

	socket.on('chat-message', async msg => {
		const messages = JSON.parse((await redisClient.get('messages')) || '[]');

		messages.push({
			client: clientsIdMap[socket.id],
			message: msg,
			timestamp: new Date().toISOString(),
		});

		await redisClient.set('messages', JSON.stringify(messages));

		sendUpdate();
	});

	socket.on('disconnect', () => {
		clients--;

		if (clientsIdMap[socket.id]) {
			delete clientsIdMap[socket.id];
		}

		sendUpdate();

		console.log('A user disconnected! 😢');
	});
});

async function sendUpdate() {
	const clients = JSON.parse((await redisClient.get('clients')) || '[]');
	const messages = JSON.parse((await redisClient.get('messages')) || '[]');

	io.emit('socket-update', {
		clients,
		messages,
	});
}

const port = process.env.PORT || 3000;

server.listen(port, async () => {
	console.log(`Running on port ${port} 🚀`);

	redisClient = await getRedisClient();
});
