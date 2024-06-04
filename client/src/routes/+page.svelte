
<script>
    import moment from 'moment';
    import { onMount } from 'svelte'
    import { io } from 'socket.io-client';
    import { generateKeys, encryptData, decryptData } from '../lib/encryption.js';

    import LoginModal from '../components/login.svelte';

    let loginModal = true;

    let messages = []
    let totalUsers = [];
    let onlineUsers = [];
    let socket;

    const keys = {
        publicKey: '',
        privateKey: '',
        serverPublicKey: ''
    }

    onMount(async () => {
        // If api key not set, show login modal
        if(localStorage.getItem('apiKey') === null) {
            loginModal = true;
            return;
        } else {
            loginModal = false;
        }

        // If username not set, generate new one
        if(localStorage.getItem('username') === null) {
            localStorage.setItem('username', generateUsername());
        }

        // If keys not set, generate new ones
        if(localStorage.getItem('publicKey') === null || localStorage.getItem('privateKey') === null) {
            // Generate new keys
            const { publicKey, privateKey } = await generateKeys();

            // Save keys to local storage
            localStorage.setItem('publicKey', publicKey);
            localStorage.setItem('privateKey', privateKey);

            // Set keys
            keys.publicKey = publicKey;
            keys.privateKey = privateKey;
        } else {
            // Set keys
            keys.publicKey = localStorage.getItem('publicKey');
            keys.privateKey = localStorage.getItem('privateKey');
        }

        // Connect to socket
        socket = io('/', {
            query: {
                // Send username as query
                username: localStorage.getItem('username'),
            },
            auth: {
                // Send public key and api key as headers
                public_key: keys.publicKey,
                api_key: localStorage.getItem('apiKey')
            }
        });

        // Receive public key from server
        socket.on('keys', (data) => {
            keys.serverPublicKey = data.publicKey;
        });

        // Receive messages from server
        socket.on('socket-update', async (data) => {
            // Iterate over messages to decrypt message text
            for(let i = 0; i < data.messages.length; i++) {
                const message = data.messages[i];

                // Decrypt message text
                const decryptedMessage = await decryptData(message.message, keys.privateKey);
                data.messages[i].message = decryptedMessage;

                // Convert client id to username
                data.messages[i].client = data.clients.find(client => client.id === message.client)?.username || message.client;
            }

            // Set data to client

            messages = data.messages;
            totalUsers = data.clients
            onlineUsers = data.onlineClients;
        });

        window.addEventListener('beforeunload', () => {
            socket.disconnect();
        });
    });

    function generateUsername() {
        const adjectives = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Black', 'White', 'Grey'];
        const animals = ['Dog', 'Cat', 'Bird', 'Fish', 'Horse', 'Cow', 'Pig', 'Sheep', 'Goat', 'Chicken'];

        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];

        return `${adjective} ${animal}`;
    }

    async function sendMessage(event) {
        event.preventDefault();

        const inputElement = document.getElementById('chat-message');

        const message = inputElement.value;
        const encryptedMessage = await encryptData(message, keys.serverPublicKey);
        
        socket.emit('chat-message', encryptedMessage);

        inputElement.value = '';
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen">
    <div class="fixed top-0 w-full bg-red-100 px-5 py-3 shadow-md z-10">
        <div class="text-xl font-semibold">Encrypted Message System</div>
        <div class="text-sm">Online users: {onlineUsers.length} • Total users: {totalUsers.length}</div>
    </div>
    <div class="w-full items-center justify-center flex-grow overflow-y-auto m-20">
        <div class="max-w-4xl w-full flex">
            <div class="w-1/4 bg-white overflow-y-auto" style="max-height: calc(100vh - 140px);">
                <div class="text-xl font-semibold">Online Users</div>
                <div class="h-full overflow-y-auto">
                    <div class="flex flex-col gap-y-1 mt-2">
                        {#each [...new Set(onlineUsers.map(user => user.username))] as user}
                            <div>{user}</div>
                        {/each}
                    </div>
                </div>
            </div>
            <div class="w-3/4 bg-blue-100 rounded-lg overflow-y-auto" style="max-height: calc(100vh - 140px);">
                <div class="px-4 py-2">
                    <div class="flex flex-col gap-y-2">
                        {#if messages.length === 0}
                            <div class="p-2 text-gray-500">No messages yet</div>
                        {:else}
                            {#each messages as message, index}
                                <div class="flex flex-col items-start p-2 rounded-lg" class:border-b={index + 1 !== messages.length}>
                                    <div class="flex justify-between w-full">
                                        <div class="text-sm font-semibold">{message.client}</div>
                                        <div class="text-xs text-blue-500">{moment(message.timestamp).format('HH:mm DD-MM-YYYY')}</div>
                                    </div>
                                    <div class="bg-green-200 rounded-lg px-3 py-2 max-w-md">{message.message}</div>
                                    {#if index + 1 !== messages.length}
                                        <div class="w-full border-b border-gray-300 mt-2"></div>
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="fixed bottom-0 w-full bg-white border-t border-gray-300 px-4 py-2 shadow-md z-10">
        <form on:submit|preventDefault={sendMessage} class="flex items-center">
            <input id="chat-message" name="message" type="text" class="flex-grow px-4 py-2 focus:outline-none" placeholder="Type your message" />
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Send</button>
        </form>
    </div>
</div>
