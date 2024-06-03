<script>
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
</form>