<template>
    <div class="pa-4" style="max-width: 1200px; margin: auto">
        <h1 class="text-h4 mt-0 mb-4">Отели, найдено {{ count }}</h1>

        <v-text-field v-model="search" variant="solo" density="comfortable" style="width: 500px" label="Поиск по названию и адресу" clearable/>

        <v-progress-linear indeterminate height="4" v-if="loading"/>
        <div style="height: 4px" v-else/>

        <v-card v-for="e in hotels" class="d-flex mt-4 pa-2" style="gap: 20px; min-height: 150px">
            <div style="flex: 0 0 250px">
                <img :alt="`${e.image} фото`" src="/no-image.png" style="max-height: 150px; display: block; margin: auto">
            </div>

            <div style="flex: 1 1 300px">
                <h1 class="text-h5 m-0">{{ e.name }}</h1>
                <div style="font-size: 16px">
                    <div style="font-size: 20px">{{ e.address }}</div>
                    <div style="color: #999">{{ e.city }}, {{ e.country }}</div>
                </div>

                <v-rating :model-value="e.stars" half-increments readonly color="#eeaa00" class="mt-2" size="24"/>
            </div>
            <div style="flex: 0 0 250px; border-radius: 12px; background: #e5fde9; align-self: center" class="pa-4 ma-2">
                <template v-if="user?.loyalty">
                    <div style="font-size: 16px;color: #999; text-decoration: line-through; text-align: right">{{ e.price }}р / день</div>
                    <div style="font-size: 12px;" class="mt-2">Цена для вас</div>
                    <div class="text-h5 text-left">{{ Math.ceil(e.price * (1 - user?.loyalty?.discount / 100)) }}р / день</div>
                </template>
                <div v-else class="text-h5 text-center">{{ e.price }} / день</div>
                <v-btn class="mt-2" color="primary" variant="flat" :to="`/hotel/${e.hotelUid}`" text="Забронировать" block/>
            </div>
        </v-card>

        <v-pagination v-model="page" :length="pages"/>
    </div>
</template>

<script>
import { useAppStore } from "@/stores/app.js";
import { useUserStore } from "@/stores/user.js";

export default {
    props: {},
    data: () => ({
        search: '',
        page: 1,
        limit: 20,
        count: 0,
        pages: 1,
        hotels: [],
        shouldSearch: true,
        loading: false,
        timer: null,
    }),
    computed: {
        user() {
            return this.userStore.user;
        }
    },
    watch: {
        page() {
            this.shouldSearch = true;
        },
        search() {
            this.page = 1;
            this.shouldSearch = true;
        }
    },
    methods: {
        runSearch() {
            if (!this.shouldSearch)
                return;
            this.shouldSearch = false;

            this.loading = true;
            this.store.searchHotels(this.page - 1, this.limit, this.search || '').then(e => {
                this.loading = false;
                if (e.status !== 200)
                    return this.hotels = [];
                this.hotels = e.data.items;
                this.count = e.data.totalElements;
                this.pages = Math.ceil(this.count / this.limit);
            });
        }
    },
    mounted() {
        this.timer = setInterval(() => this.runSearch(this.page), 200);
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