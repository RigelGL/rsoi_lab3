<template>
    <div class="d-flex flex-grow-1">
        <v-app-bar elevation="1" style="width: 100%">
            <div style="width: 100%; height: 100%" class="d-flex justify-center">
                <div class="d-flex" style="height: 100%">
                    <v-btn to="/hotels" text="Отели" variant="flat" :rounded="false" style="height: 100%"/>
                    <v-btn to="/reservations" text="Мои бронирования" variant="flat" :rounded="false" style="height: 100%"/>
                    <v-btn to="/profile" :text="user?.name" prepend-icon="mdi-account" variant="flat" :rounded="false" style="height: 100%"/>
                    <v-btn to="/admin" text="Админка" variant="flat" :rounded="false" style="height: 100%" v-if="role === 'admin'"/>
                </div>
            </div>
        </v-app-bar>
        <v-main>
            <div class="pt-4 pl-4" style="min-height: 100%; background: #f8f8f8">
                <slot/>
            </div>
        </v-main>
    </div>
</template>

<script>

    import { useUserStore } from "@/stores/user.js";

    export default {
        components: {},
        computed: {
            user() {
                return this.store.user;
            },
            role() {
                return this.store.role;
            }
        },
        watch: {
            user(curr, prev) {
                if (!prev && curr)
                    this.store.getMe();
            }
        },
        methods: {},
        mounted() {
            if (!this.user)
                this.store.getMe();
        },
        setup() {
            return { store: useUserStore() }
        }
    }
</script>