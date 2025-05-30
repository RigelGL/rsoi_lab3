<template>
    <div class="pa-4" style="max-width: 1200px; margin: auto">
        <div class="d-flex align-center justify-space-between">
            <h1 class="text-h4 mt-0 mb-4">Бронь</h1>
            <v-btn :to="`/reservations`" color="primary" variant="text" size="small" text="Все бронирования"/>
        </div>

        <v-card class="pa-4">
            <div style="font-size: 20px">Отель: {{ reservation?.hotel?.name }}</div>

            <div style="font-size: 16px" v-if="!!reservation?.hotel">
                <div style="font-size: 20px">{{ reservation.hotel.address }}</div>
                <div style="color: #999">{{ reservation.hotel.city }}, {{ reservation.hotel.country }}</div>
            </div>

            <div class="mt-4" v-if="!!reservation">
                <div style="font-size: 20px">
                    Период: {{ reservation.startDate }} - {{ reservation.endDate }}
                </div>
            </div>

            <div class="mt-4" v-if="!!reservation?.payment">
                <div style="font-size: 20px">
                    Статус оплаты: {{ payment[reservation.payment.status] }}
                </div>
                <div style="font-size: 14px; color: #999999" v-if="reservation.payment.status === 'PAID'">
                    Сумма: {{ reservation.payment.price }}
                </div>
            </div>

            <v-btn color="red" text="Отменить" @click="cancelDialog = true" class="mt-8" v-if="reservation?.payment?.status === 'PAID'"/>
        </v-card>

        <v-dialog v-model="cancelDialog" max-width="350">
            <v-card>
                <v-card-title class="headline">Отменить бронь?</v-card-title>
                <v-card-text>
                    Ваша скидка может быть понижена
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="cancelDialog = false">Не отменять</v-btn>
                    <v-btn color="red darken-1" text @click="confirmCancel()" :loading="cancelLoading">Отменить</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { useUserStore } from "@/stores/user.js";

export default {
    data: () => ({
        reservation: null,
        payment: {
            PAID: 'Оплачено',
            CANCELED: 'Отменено',
        },

        cancelDialog: false,
        cancelLoading: false,
    }),
    methods: {
        reload() {
            this.store.getMyReservation(this.$route.params?.uid).then(e => {
                if (e.status !== 200)
                    return this.reservation = null;
                this.reservation = e.data;
            });
        },
        confirmCancel() {
            if (this?.reservation?.payment?.status !== 'PAID')
                return;
            this.cancelLoading = true;
            this.store.cancelMyReservation(this.reservation.reservationUid).then(e => {
                this.cancelLoading = false;
                if(e.status >= 400)
                    return;
                this.cancelDialog = false;
                this.reload();
            });
        }
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