<template>
    <div>
        <div class="pa-4" style="max-width: 1200px; margin: auto">
            <h1 class="text-h4 mt-0 mb-4">Мои бронирования</h1>

            <v-card class="pa-4 mb-4" v-for="reservation in reservations">
                <div style="font-size: 20px">
                    {{ reservation?.hotel?.name }}, {{ reservation.startDate }} - {{ reservation.endDate }}
                </div>

                <div style="font-size: 16px" v-if="!!reservation?.hotel">
                    <div style="color: #999">{{ reservation.hotel.address }}, {{ reservation.hotel.city }}, {{ reservation.hotel.country }}</div>
                </div>

                <div class="mt-4" v-if="!!reservation?.payment">
                    <div style="font-size: 16px">
                        {{ payment[reservation.payment.status] + (reservation.payment.status === 'PAID' ? `, ${reservation.payment.price} р` : '') }}
                    </div>
                </div>

                <v-btn :to="`/reservation/${reservation.reservationUid}`" class="mt-4" color="primary" text="К бронированию"/>
            </v-card>
        </div>
    </div>
</template>

<script>
import { useAppStore } from "@/stores/app.js";
import { useUserStore } from "@/stores/user.js";

export default {
    props: {},
    data: () => ({
        reservations: [],
        loading: false,
        shouldSearch: true,
        timer: null,
        payment: {
            PAID: 'Оплачено',
            CANCELED: 'Отменено',
        }
    }),
    methods: {
        runSearch() {
            if (!this.shouldSearch)
                return;
            this.shouldSearch = false;
            this.loading = true;
            this.userStore.getMyReservations().then(e => {
                if (e.status !== 200)
                    return this.reservations = [];
                this.reservations = e.data;
            })
        }
    },
    mounted() {
        this.timer = setInterval(() => this.runSearch(), 200);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    setup() {
        return { store: useAppStore(), userStore: useUserStore() };
    }
}
</script>

<style scoped lang="scss">

</style>