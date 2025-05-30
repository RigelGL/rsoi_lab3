<template>
    <div style="width: 320px">
        <div class="text-h4 text-center">Авторизация</div>
        <v-text-field label="Логин" v-model="email" density="compact" variant="outlined" class="mt-6 mb-2" hide-details/>
        <v-text-field label="Пароль" v-model="password" :type="hide ? 'password' : 'text'" :error-messages="error" density="compact" variant="outlined">
            <template #append-inner>
                <v-btn @click="hide = !hide" size="x-small" flat :icon="hide ? 'mdi-eye-off' : 'mdi-eye'"/>
            </template>
        </v-text-field>

        <v-btn size="large" text="Войти по логину и паролю" color="green" block @click="login()"/>

        <v-btn size="x-large" text="Войти через Google" color="purple" block class="mt-8" @click="login2('google')"/>
        <v-btn size="x-large" text="Войти через Yandex" color="yellow" block class="mt-8" @click="login2('yandex')"/>
    </div>
</template>

<script>
import { useUserStore } from "@/stores/user.js";

export default {
    props: {},
    data: () => ({
        email: '',
        password: '',
        hide: false,
        error: null,
    }),
    methods: {
        login() {
            this.error = 'Авторизация недоступна';
        },
        login2(provider) {
            this.userStore.login(provider, undefined, undefined).then(e => {
                if(e.status !== 200) {
                    this.error = 'Ошибка';
                    return;
                }
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