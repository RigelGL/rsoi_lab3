<template>
    <v-card>
        <v-card-title>Отели</v-card-title>
        <v-card-text>
            <v-table density="compact">
                <thead>
                <tr>
                    <td style="width: 50px">#</td>
                    <td style="width: 320px">Guid</td>
                    <td>Название</td>
                    <td>Адрес</td>
                    <td style="width: 100px">Звезды</td>
                    <td style="width: 100px">Цена</td>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(e, i) in hotels">
                    <td>{{ i + 1 }}</td>
                    <td>{{ e.hotelUid }}</td>
                    <td>{{ e.name }}</td>
                    <td>{{ e.fullAddress }}</td>
                    <td>{{ e.stars }}</td>
                    <td>{{ e.price }}</td>
                </tr>
                </tbody>
            </v-table>

            <v-btn class="mt-4" variant="outlined" color="primary" @click="dialog = true">Добавить</v-btn>
            <v-dialog v-model="dialog" width="600">
                <v-card>
                    <v-card-title>Добавить отель</v-card-title>
                    <v-card-text>
                        <v-text-field variant="outlined" density="compact" v-model="add.name" label="Название отеля"/>
                        <v-text-field variant="outlined" density="compact" v-model="add.country" label="Страна"/>
                        <v-text-field variant="outlined" density="compact" v-model="add.city" label="Город"/>
                        <v-text-field variant="outlined" density="compact" v-model="add.address" label="Адрес"/>
                        <v-text-field variant="outlined" density="compact" v-model="add.stars" label="Звёзд" type="number" min="1" max="5" step="1"/>
                        <v-text-field variant="outlined" density="compact" v-model="add.price" label="Цена" type="number" min="1" step="1"/>
                    </v-card-text>
                    <v-card-actions class="d-flex justify-space-between">
                        <v-btn variant="outlined" @click="dialog = false">Отмена</v-btn>
                        <v-btn variant="outlined" color="primary" @click="addHotel()">Добавить</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-card-text>
    </v-card>
</template>

<script>
import { useAdminStore } from "@/stores/admin.js";
import { useAppStore } from "@/stores/app.js";

export default {
    props: {},
    data: () => ({
        hotels: [],
        count: 0,
        dialog: false,
        add: {
            name: '',
            country: '',
            city: '',
            address: '',
            price: 0,
            stars: 0,
        },
    }),
    methods: {
        reload() {
            this.app.searchHotels(1, 1000, '').then(e => {
                if (e.status !== 200)
                    return this.hotels = [];
                this.hotels = e.data.items;
                this.count = e.data.totalElements;
            });
        },
        addHotel() {
            this.store.addHotel(this.add).then(e => {
                if (e.status < 300) {
                    this.reload();
                    this.dialog = false;
                }
            });
        }
    },
    mounted() {
        this.reload();
    },
    setup() {
        return { store: useAdminStore(), app: useAppStore() }
    }
}
</script>

<style scoped lang="scss">

</style>