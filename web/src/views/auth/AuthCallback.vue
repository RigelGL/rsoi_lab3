<template>
    <div>
        <div class="h4">Авторизация...</div>
        <div style="color: #aa0000" class="mt-4">{{ error || '' }}</div>
    </div>
</template>

<script>
import { useUserStore } from "@/stores/user.js";

export default {
    data: () => ({
        error: null,
    }),
    mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code)
            return;
        this.userStore.callback(code).then(e => {
            if (e.status !== 200)
                this.error = 'Ошибка: ' + e.data?.error;
            window.location.href = '/';
        });
    },
    setup() {
        return { userStore: useUserStore() }
    }
}
</script>

<style scoped lang="scss">

</style>