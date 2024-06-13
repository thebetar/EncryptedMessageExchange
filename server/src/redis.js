const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_URL = `redis://${REDIS_HOST}:6379`;

let tries = 0;

async function getRedisClient() {
	try {
		if (tries > 5) {
			console.error('Error connecting to Redis:', REDIS_URL);
			process.exit(1);
		}

		return {
			client: createClient({
				url: REDIS_URL,
			}),
			pub: createClient({
				url: REDIS_URL,
			}),
			sub: createClient({
				url: REDIS_URL,
			}),
		};
	} catch (err) {
		console.error('Error connecting to Redis:', REDIS_URL);
		console.error('Retrying in 5 seconds...');
		tries++;

		return new Promise(resolve => setTimeout(() => resolve(getRedisClient()), 5000));
	}
}

module.exports = getRedisClient;
