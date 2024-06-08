<script>
    import { encryptData } from "../lib/encryption";

    export let keys;
    export let socket;

    async function sendMessage(event) {
        event.preventDefault();

        const inputElement = document.getElementById('chat-message');

        const message = inputElement.value;

        if(message === '') {
            return;
        }

        const encryptedMessage = await encryptData(message, keys.serverPublicKey);

        socket.emit('chat-message', encryptedMessage);

        inputElement.value = '';
    }
</script>

<form on:submit={sendMessage} class="flex flex-1 gap-x-2">
    <input 
        id="chat-message"
        name="message" 
        class="flex-1 text-black py-2 px-4 border border-zinc-400 rounded-full" type="text" placeholder="Type your message"
        />
    <button type="submit" class="bg-[#075e54] hover:bg-[#128c7e] md:p-4 p-2 rounded-full flex items-center justify-center cursor-pointer transition">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 12L1 1L7 14L1 23L23 12Z" fill="#ffffff"/>
        </svg>
    </button>
</form>

