<!-- <script>
    import { encryptData } from "../lib/encryption";

    export let socket;
    export let keys;

    async function sendMessage(event) {
        event.preventDefault();

        const inputElement = document.getElementById('chat-message');

        const message = inputElement.value;

        if(message === ''){
            return;
        }

        const encryptedMessage = await encryptData(message, keys.serverPublicKey);
        
        socket.emit('chat-message', encryptedMessage);

        inputElement.value = '';
    }
</script>

<form class="md:w-[600px] w-full flex flex-col gap-y-2" on:submit={sendMessage}>
    <div>
        <label for="message" class="md:text-lg text-base">
            Message
        </label>

        <input id="chat-message" name="message" type="text" class="border border-white bg-zinc-900 rounded-lg p-2 w-full" placeholder="Enter your message" />
    </div>

    <button class="border border-white rounded-lg p-2 w-full hover:bg-zinc-700 transition-colors active:bg-zinc-700">
        Send
    </button>
</form> -->

<script>
 import { encryptData } from "../lib/encryption";
    export let keys;
    export let socket;

    async function sendMessage(event) {
        event.preventDefault();
        const inputElement = document.getElementById('chat-message');
        const message = inputElement.value;
        const encryptedMessage = await encryptData(message, keys.serverPublicKey);
        socket.emit('chat-message', encryptedMessage);
        inputElement.value = '';
    }
</script>

<style>
    form {
        display: flex;
        flex-grow: 1;
    }

    input {
        flex-grow: 1;
        padding: 0.5rem;
        border: 1px solid #e9ecef;
        border-radius: 30px;
        margin-right: 1rem;
    }

    button {
        background-color: #075e54;
        color: white;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    button:hover {
        background-color: #128c7e;
    }
</style>

<form on:submit={sendMessage}>
    <input id="chat-message" name="message" class="text-black" type="text" placeholder="Type your message" />
    <button type="submit">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 12L1 1L7 14L1 23L23 12Z" fill="currentColor"/>
        </svg>
    </button>
</form>

