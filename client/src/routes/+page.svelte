<script>
    import { onMount } from 'svelte'
    import moment from 'moment';
    import { io } from 'socket.io-client';

    let messages = []
    let userCount = 0
    let socket;

    onMount(() => {
        socket = io();

        if(localStorage.getItem('username') === null) {
            localStorage.setItem('username', generateUsername());
        }
        
        socket.emit('new-user', localStorage.getItem('username'));

        socket.on('socket-update', (data) => {
            messages = data.messages;
            userCount = data.clients.length;

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

    function sendMessage(event) {
        event.preventDefault();

        const inputElement = document.getElementById('chat-message');

        const message = inputElement.value;
        
        socket.emit('chat-message', message);

        inputElement.value = '';
    }
</script>

<div class="flex flex-col items-center md:gap-y-3 gap-y-2">
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
    
        <button class="border border-black rounded-lg p-2 w-full">
            Send
        </button>
    </form>
    
    <div class="md:text-lg text-base">
        Current users: {userCount}
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
</div>

