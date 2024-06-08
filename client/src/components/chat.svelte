 <script>
    import moment from 'moment';
    export let messages;
</script>

<div class="messages">
    {#if messages.length === 0}
        <div class="text-gray-500">No messages yet</div>
    {:else}
       {#each messages.slice().reverse() as message, index}
              
            <div class="message {message.client === localStorage.getItem('username') ? 'me' : ''}">
                <div class="message-header">{message.message}</div>
                <div>
                    <div class="text-xs">{message.client}</div>
                    <div class="text-xs">{moment(message.timestamp).format('HH:mm DD-MM-YYYY')}</div>
                </div>
                
            </div>
        {/each}
    {/if}
</div>

<style>
    .messages {
        flex-grow: 1;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        background-color: #e5ddd5;
        overflow-y: auto;
    }

    .message {
        margin-bottom: 1rem;
        padding: 0.5rem;
        background-color: #dcf8c6;
        color: black;
        border-radius: 7.5px;
        max-width: 60%;
        align-self: flex-start;
    }

    .message.me {
        background-color: #34b7f1;
        align-self: flex-end;
        color: black;
    }

    .message-header {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
</style>
