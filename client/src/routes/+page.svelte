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

            messages.reverse();
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

<div class="flex flex-col items-center md:gap-y-3 gap-y-2">
    {#if loginModal}
        <LoginModal />
    {:else}
        <div class="md:text-4xl text-xl font-semibold">
            Encrypted exchange service
        </div>

        <form class="md:w-[600px] w-full flex flex-col gap-y-2" on:submit={sendMessage}>
            <div>
                <label for="message" class="md:text-lg text-base">
                    Message
                </label>
        
                <input id="chat-message" name="message" type="text" class="border border-black rounded-lg p-2 w-full" placeholder="Enter your message" />
            </div>
        
            <button class="border border-black rounded-lg p-2 w-full hover:bg-zinc-100 transition-colors">
                Send
            </button>
        </form>
        
        <div class="flex flex-col gap-y-1 items-center">
            <div class="md:text-lg text-base">
                Online users: {onlineUsers.length}
            </div>
        
            <div class="md:text-sm text-xs">
                Total users: {totalUsers.length}
            </div>
        </div>

        <div class="border border-black rounded-lg md:w-[600px] w-full p-2">
            {#if messages.length === 0}
                <div class="p-2">
                    No messages yet
                </div>
            {:else}
                {#each messages as message, index}
                    <div class="flex justify-between border-b-zinc-400" class:border-b={index + 1 !== messages.length}>
                        <div class="py-2 leading-5 text-sm">
                            <span class="font-semibold">{message.client}</span>: {message.message}
                        </div>
                        <div class="text-xs underline min-w-[112px] h-9 flex items-center justify-end">
                            {moment(message.timestamp).format('HH:mm DD-MM-YYYY')}
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>

