<template>
    <div class="pa-4" style="width: 600px; margin: auto">
        <h1 class="text-h4 mt-0 mb-4">Профиль {{ user?.name }}</h1>

        <v-card >
            <v-card-text>
                <div class="text-h6">Лояльность</div>
                <div v-if="loyaltyError" style="color: #aa0000; font-size: 12px">
                    {{ loyaltyError }}
                </div>

                <div v-if="loyalty" class="d-flex mt-2">
                    <div>
                        <img alt :src="status[loyalty.status]?.img" style="display: block; width: 100px"/>
                    </div>
                    <div class="ml-4">
                        <div style="font-size: 20px">
                            Ваш уровень: {{ status[loyalty.status]?.name }}
                        </div>
                        <div class="mt-2">
                            Ваша скидка: {{ loyalty.discount }}
                        </div>
                        <div class="mt-0">
                            Бронирований: {{ loyalty.reservationCount }}
                        </div>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="leaveDialog = true" variant="text" color="error" text="Выйти"/>
            </v-card-actions>
        </v-card>
        <v-dialog v-model="leaveDialog" max-width="350">
            <v-card>
                <v-card-title class="headline">Выйти?</v-card-title>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="leaveDialog = false">Остаться</v-btn>
                    <v-btn color="red darken-1" text @click="logout()">Выйти</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { useUserStore } from "@/stores/user.js";

export default {
    data: () => ({
        leaveDialog: false,
        status: {
            BRONZE: { name: 'Бронзовый', img: '/bronze.png' },
            SILVER: { name: 'Серебрянный', img: '/silver.png' },
            GOLD: { name: 'Золотой', img: '/gold.png' },
        },
        loyalty: null,
        loyaltyError: null,
    }),
    computed: {
        user() {
            return this.store.user;
        },
    },
    watch: {
        user() {
            this.reload();
        }
    },
    methods: {
        reload() {
            this.loyaltyError = null;
            this.loyalty = null;

            if (this.user) {
                this.loyaltyError = null;
                this.store.getMyLoyalty().then(e => {
                    if (e.status !== 200)
                        return this.loyaltyError = e.data?.error;
                    this.loyalty = e.data;
                });
            }
        },
        logout() {
            this.store.logout();
            localStorage.removeItem('token');
            this.$router.push('/login');
        },
    },
    mounted() {
        this.reload();
    },
    setup() {
        return { store: useUserStore() }
    }
}
</script>

<style scoped lang="scss">

</style>