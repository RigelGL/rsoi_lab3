<template>
    <div class="pa-4" style="max-width: 1200px; margin: auto">
        <div class="d-flex align-center justify-space-between">
            <h1 class="text-h4 mt-0 mb-4">Забронировать отель {{ hotel?.name }}</h1>
            <v-btn :to="`/hotels`" color="primary" variant="text" size="small" text="Все отели"/>
        </div>

        <div class="d-flex" style="gap: 20px" v-if="!!hotel">
            <div>
                <div style="font-size: 20px; font-weight: 700">С</div>
                <v-date-picker v-model="startDate" first-day-of-week="1" hide-header/>
            </div>
            <div>
                <div style="font-size: 20px; font-weight: 700">По</div>
                <v-date-picker v-model="endDate" first-day-of-week="1" hide-header :min="startDate"/>
            </div>
            <div>
                <v-card v-if="startDate && endDate && +endDate >= +startDate && !!user.loyalty" class="pa-4 mt-7" elevation="0" style="width: 250px">
                    <div style="font-size: 20px">К оплате</div>
                    <div style="font-size: 24px" class="mt-2">
                        {{ ((+endDate - +startDate) / 86400000 + 1) * hotel.price * (1 - (user.loyalty.discount || 0) / 100) }} р
                    </div>
                    <v-btn @click="confirm()" variant="flat" color="primary" size="large" class="mt-4" :loading="loading">Забронировать</v-btn>
                </v-card>
            </div>
        </div>
        <div v-if="error" style="font-size: 20px; color: #aa0000">{{ errors[error] || error }}</div>

    </div>
</template>

<script>
import { useAppStore } from "@/stores/app.js";
import { useUserStore } from "@/stores/user.js";

export default {
    props: {},
    data: () => ({
        startDate: null,
        endDate: null,
        hotel: null,
        loading: false,
        error: null,

        errors: {
            hotel: 'Сервис отелей недоступен. Попробуйте позже',
            loyalty: 'Сервис лояльности недоступен. Попробуйте позже',
            loyaltyUpd: 'Сервис лояльности недоступен. Попробуйте позже',
            payment: 'Сервис оплаты недоступен. Попробуйте позже',
            reservation: 'Сервис бронирования недоступен. Попробуйте позже',
        }
    }),
    computed: {
        user() {
            return this.userStore.user;
        }
    },
    methods: {
        confirm() {
            if (!this.hotel)
                return;

            this.error = null;

            if (!this.startDate || !this.endDate)
                return this.error = 'Укажите дату начала и дату окончания';

            const offset = new Date().getTimezoneOffset() * 60_000;
            const start = new Date(+this.startDate - offset)?.toISOString();
            const end = new Date(+this.endDate - offset)?.toISOString();

            this.loading = true;
            this.userStore.confirmReservation(this.hotel.hotelUid, start, end).then(e => {
                this.loading = false;
                if (e.status !== 200)
                    return this.error = e.data.error;
                this.$router.push(`/reservation/${e.data.reservationUid}`);
            });
        }
    },
    mounted() {
        this.store.getHotel(this.$route.params.uid).then((res) => {
            this.hotel = res.data || null;
        })
    },
    setup() {
        return { store: useAppStore(), userStore: useUserStore() };
    }
}
</script>

<style scoped lang="scss">

</style>