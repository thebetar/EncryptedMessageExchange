const crypto = require('crypto');

function generateKeys() {
	const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem',
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
		},
	});

	return { publicKey, privateKey };
}

function encryptData(data, publicKey) {
	try {
		// Create buffer from data (unicode string)
		const buffer = Buffer.from(data, 'utf8');

		// Encrypt data with public key and by adding OAEP padding since frontend encrypted data with OAEP padding
		// Parse result as base64 string
		return crypto
			.publicEncrypt(
				{
					key: publicKey,
					padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
					oaepHash: 'sha256',
				},
				buffer,
			)
			.toString('base64');
	} catch (error) {
		console.error(error);
		return data;
	}
}

let decryptTries = 0;

function decryptData(data, privateKey) {
	try {
		// Create buffer from base64 string
		const buffer = Buffer.from(data, 'base64');

		// Decrypt data with private key and by adding OAEP padding since frontend encrypted data with OAEP padding
		// Parse result as unicode
		return crypto
			.privateDecrypt(
				{
					key: privateKey,
					padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
					oaepHash: 'sha256',
				},
				buffer,
			)
			.toString('utf8');
	} catch (error) {
		console.error(error);

		// Prevent infinite loop (this error is apparently caused since it does not load the shared library on time but it does after a retry)
		if (decryptTries < 3) {
			decryptTries++;
			return decryptData(data, privateKey);
		}

		return 'Invalid message';
	}
}

module.exports = {
	generateKeys,
	encryptData,
	decryptData,
};
