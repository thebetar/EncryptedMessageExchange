<script>
    import { onMount } from 'svelte'
    import { SocketClient } from '../lib/socket.js';

    import LoginModal from '../components/login.svelte';
	import Chat from '../components/chat.svelte';
	import Form from '../components/form.svelte';

    let loading = true;
    let loginModal = true;
    let socketClient;
    let serverName;

    let messages = [];
    let onlineUsers = [];
    let totalUsers = [];

    onMount(async () => {
        // Get server name
        const response = await fetch('/api/server-name');
        const data = await response.text();

        serverName = data;

        // If api key not set, show login modal
        if(localStorage.getItem('apiKey') === null) {
            loginModal = true;
            loading = false;
            return;
        } else {
            loginModal = false;
        }

        // If username not set, generate new one
        if(localStorage.getItem('username') === null) {
            localStorage.setItem('username', generateUsername());
        }

        socketClient =  new SocketClient();

        socketClient.store.subscribe(value => {
            messages = value.messages;
            onlineUsers = value.onlineUsers;
            totalUsers = value.totalUsers;
        });

        await socketClient.init();

        // Unset loading
        loading = false;
    });

    function generateUsername() {
        const adjectives = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Black', 'White', 'Grey'];
        const animals = ['Dog', 'Cat', 'Bird', 'Fish', 'Horse', 'Cow', 'Pig', 'Sheep', 'Goat', 'Chicken'];

        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];

        return `${adjective} ${animal}`;
    }
</script>

<div class="flex flex-col items-center md:gap-y-3 gap-y-2 text-white">
    {#if loading}
        <div>
            Loading...
        </div>
    {:else if loginModal}
        <LoginModal />
    {:else}
        <div class="md:text-4xl text-xl font-semibold">
            Encrypted exchange service
        </div>

        <div>
            Connected to server "{serverName}"
        </div>

        <Form keys={socketClient.keys} socket={socketClient.socket} />
        
        <div class="flex flex-col gap-y-1 items-center">
            <div class="md:text-lg text-base">
                Online users: {onlineUsers.length}
            </div>
        
            <div class="md:text-sm text-xs">
                Total users: {totalUsers.length}
            </div>
        </div>

        <Chat messages={messages} />
    {/if}
</div>

