<script>
    import moment from 'moment';
    export let messages;
</script>

<div class="w-full h-full md:p-4 p-2 bg-[#e5ddd5] flex gap-2 flex-col justify-end">
    {#if messages.length === 0}
        <div class="text-gray-500">No messages yet</div>
    {:else}
        {#each messages.slice().reverse() as message, index}
            <div class="flex flex-col gap-y-1 px-4 py-2 md:w-[600px] w-[300px] rounded-lg text-black {message.client === localStorage.getItem('username') ? 'bg-green-600 self-end' : 'bg-green-400'}">
                <div class="font-semibold">{message.message}</div>
                <div>
                    <div class="text-xs">{message.client}</div>
                    <div class="text-xs">{moment(message.timestamp).format('HH:mm DD-MM-YYYY')}</div>
                </div>
                
            </div>
        {/each}
    {/if}
</div>
