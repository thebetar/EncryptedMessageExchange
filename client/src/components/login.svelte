<script>
    let password = '';
    let errorToggle = false;

    async function submitPassword() {
        if(!password) {
            errorToggle = true;

            setTimeout(() => {
                errorToggle = false;
            }, 3000);
            return;
        }

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        })

        if(response.ok) {
            const data = await response.json();
            localStorage.setItem('apiKey', data.apiKey);

            window.location.reload();
        } else {
            errorToggle = true;

            setTimeout(() => {
                errorToggle = false;
            }, 3000);
        }
    }
</script>

<div class="fixed top-0 left-0 bg-black opacity-80 w-screen h-screen flex justify-center items-center p-4">
    <div class="md:w-[300px] w-full p-4 bg-white flex flex-col gap-y-1 rounded-md text-zinc-900">
        <h1 class="text-2xl">
            Login
        </h1>
        <p class="text-base">
            This website requires a password to access. What is it?
        </p>
        {#if errorToggle}
            <p class="text-red-500 text-sm">
                Please enter a correct password
            </p>
        {/if}
        <form class="flex flex-col gap-y-2" on:submit|preventDefault={submitPassword}>
            <input type="password" class="border border-black rounded-lg p-2" placeholder="Password" bind:value={password} />
            <button class="border border-black rounded-lg p-2 hover:bg-zinc-300 transition-colors disabled:opacity-80" disabled={!password}>
                Submit
            </button>
        </form>
    </div>
</div>