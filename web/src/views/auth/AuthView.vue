<template>
    <div style="width: 320px">
        <div class="text-h4 text-center">Авторизация</div>
        <v-text-field label="Логин" v-model="email" density="compact" variant="outlined" class="mt-6 mb-2" hide-details/>
        <v-text-field label="Пароль" v-model="password" :type="hide ? 'password' : 'text'" :error-messages="error" density="compact" variant="outlined">
            <template #append-inner>
                <v-btn @click="hide = !hide" size="x-small" flat :icon="hide ? 'mdi-eye-off' : 'mdi-eye'"/>
            </template>
        </v-text-field>

        <v-btn size="large" text="Войти по логину и паролю" color="green" block @click="login()" :loading="loading"/>

        <v-btn size="x-large" text="Войти через Google" color="purple" block class="mt-8"
               @click="login2('google')" :loading="loading"/>
        <v-btn size="x-large" text="Войти через Yandex" color="yellow" block class="mt-8"
               @click="login2('yandex')" :loading="loading"/>
    </div>
</template>

<script>
import { useUserStore } from "@/stores/user.js";

export default {
    props: {},
    data: () => ({
        email: '',
        password: '',
        hide: true,
        error: null,

        loading: false,
    }),
    methods: {
        login() {
            this.error = null;
            const login = this.email?.trim() || '';
            const password = this.password?.trim() || '';

            if (!login) return this.error = 'Введите логин';
            if (!password) return this.error = 'Введите пароль';

            this.loading = true;
            this.userStore.login('self', login, password).then(e => {
                this.loading = false;
                if (e.status !== 200) {
                    this.error = e.data?.error || 'Ошибка';
                    return;
                }

                if (e.data.token || e.data.jwt) {
                    this.$router.push('/');
                }
            });
        },
        login2(provider) {
            this.error = null;
            this.loading = true;
            this.userStore.login(provider, undefined, undefined).then(e => {
                this.loading = false;
                if (e.status !== 200) {
                    this.error = 'Ошибка';
                    return;
                }

                if (e.data.redirectUrl)
                    window.location.href = e.data.redirectUrl;
            });
        },
    },
    mounted() {
    },
    setup() {
        return { userStore: useUserStore(), };
    }
}
</script>

<style scoped lang="scss">

</style>