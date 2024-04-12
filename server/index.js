const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const port = 3000;

const io = new Server(server);

app.get('/', (req, res) => {
	res.send('Server is running! 🚀');
});

io.on('connection', socket => {
	console.log('A user connected! 🎉');
});

server.listen(port, () => {
	console.log(`Running on port ${port} 🚀`);
});
