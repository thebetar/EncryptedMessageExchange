<script>
    import moment from "moment";

    export let messages;
</script>

<div class="border border-white rounded-lg md:w-[600px] w-full p-2">
    {#if messages.length === 0}
        <div class="p-2">
            No messages yet
        </div>
    {:else}
        {#each messages as message, index}
            <div class="flex justify-between border-b-neutral-300" class:border-b={index + 1 !== messages.length}>
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