<script>
    import { onMount } from 'svelte';
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
        if (localStorage.getItem('apiKey') === null) {
            loginModal = true;
            loading = false;
            return;
        } else {
            loginModal = false;
        }

        // If username not set, generate new one
        if (localStorage.getItem('username') === null) {
            localStorage.setItem('username', generateUsername());
        }

        socketClient = new SocketClient();
        socketClient.store.subscribe(value => {
            messages = value.messages;
            onlineUsers = value.onlineUsers;
            totalUsers = value.totalUsers;
        });

        await socketClient.init();
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

<div class="flex flex-col h-screen overflow-y-hidden">
    {#if loading}
        <div class="p-4">Loading...</div>
    {:else if loginModal}
        <LoginModal />
    {:else}
        <div class="md:p-4 p-2 bg-[#07335e] text-white flex justify-between items-center">
            <div class="md:text-xl text-sm font-semibold">Encrypted exchange service</div>
            <div class="flex gap-1 text-sm md:flex-row flex-col">
                <div>Online users: {onlineUsers.length}</div><div>Total users: {totalUsers.length}</div>
            </div>
        </div>

        <div class="flex-1 flex">
            <div class="p-4 w-[240px] bg-[#f8f9fa]  border border-zinc-300 md:block hidden">
                <div class="text-black font-semibold mb-2">Online Users</div>
                <div>
                    {#each [...new Set(onlineUsers.map(user => user.username))] as user}
                        <div class="flex items-center gap-x-1">
                            <div class="w-2 h-2 rounded-full bg-green-700"></div>
                            <div class="text-black">{user}</div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="messages flex-1 flex flex-col">
                <div class="flex-1 border border-zinc-300">
                    <Chat {messages} />
                </div>

                <div class="md:p-4 p-3 bg-white flex items-center border border-zinc-300">
                    <Form keys={socketClient.keys} socket={socketClient.socket} />
                </div>
            </div>

        </div>
        

    {/if}
</div>
