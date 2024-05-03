function ab2str(buf) {
	// Convert binary to string
	return String.fromCharCode(...new Uint8Array(buf));
}

async function exportPublicKey(publicKey) {
	// Export public key object
	const exported = await crypto.subtle.exportKey('spki', publicKey);
	// Convert binary to base64 string
	const exportedAsString = ab2str(exported);
	// Encode base64 string
	const exportedAsBase64 = btoa(exportedAsString);
	// Add PEM header and footer
	const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;

	// Return PEM formatted public key
	return pemExported;
}

async function exportPrivateKey(privateKey) {
	// Export private key object
	const exportedPrivateKey = await crypto.subtle.exportKey('pkcs8', privateKey);
	// Convert binary to base64 string
	const exportedAsString = ab2str(exportedPrivateKey);
	// Encode base64 string
	const exportedAsBase64 = btoa(exportedAsString);
	// Add PEM header and footer
	const pemExported = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;

	// Return PEM formatted private key
	return pemExported;
}

function str2ab(str) {
	// Create empty buffer with same length as string for result
	const buf = new ArrayBuffer(str.length);
	// Create a view of the buffer
	const bufView = new Uint8Array(buf);

	// Convert string to binary
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}

	// Return binary
	return buf;
}

function importPublicKey(pem) {
	// fetch the part of the PEM string between header and footer
	const pemHeader = '-----BEGIN PUBLIC KEY-----';
	const pemFooter = '-----END PUBLIC KEY-----';
	const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length - 1);
	// String to binary
	const binaryDerString = atob(pemContents);
	// Convert from a binary string to an ArrayBuffer
	const binaryDer = str2ab(binaryDerString);

	// Import public key object
	return crypto.subtle.importKey(
		'spki',
		binaryDer,
		{
			name: 'RSA-OAEP',
			hash: 'SHA-256',
		},
		true,
		['encrypt'],
	);
}

function importPrivateKey(pem) {
	// fetch the part of the PEM string between header and footer
	const pemHeader = '-----BEGIN PRIVATE KEY-----';
	const pemFooter = '-----END PRIVATE KEY-----';
	const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length - 1);
	// base64 decode the string to get the binary data
	const binaryDerString = atob(pemContents);
	// convert from a binary string to an ArrayBuffer
	const binaryDer = str2ab(binaryDerString);

	return crypto.subtle.importKey(
		'pkcs8',
		binaryDer,
		{
			name: 'RSA-OAEP',
			hash: 'SHA-256',
		},
		true,
		['decrypt'],
	);
}

export async function generateKeys() {
	// Create two crypto object instances
	const { publicKey, privateKey } = await crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: 'SHA-256',
		},
		true,
		['encrypt', 'decrypt'],
	);

	return { publicKey: await exportPublicKey(publicKey), privateKey: await exportPrivateKey(privateKey) };
}

export async function encryptData(data, publicKeyStr) {
	// Import public key object
	const publicKey = await importPublicKey(publicKeyStr);

	// Encode data to binary
	const encodedData = new TextEncoder().encode(data);

	// Encrypt data
	const encryptedData = await crypto.subtle.encrypt(
		{
			name: 'RSA-OAEP',
		},
		publicKey,
		encodedData,
	);

	// Convert binary to base64 string
	return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
}

export async function decryptData(data, privateKeyStr) {
	// Import private key object
	const privateKey = await importPrivateKey(privateKeyStr);

	// Convert base64 string to binary
	const encryptedData = Uint8Array.from(atob(data), c => c.charCodeAt(0));

	// Decrypt data
	const decryptedData = await crypto.subtle.decrypt(
		{
			name: 'RSA-OAEP',
		},
		privateKey,
		encryptedData,
	);

	// Decode binary to text
	return new TextDecoder().decode(new Uint8Array(decryptedData));
}
