<template>
    <div class="pa-2">
        <v-card style="width: 300px">
            <v-card-title>Отели</v-card-title>
            <v-card-text>
                Поиск и бронирование отелей
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" to="/hotels">К отелям</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
export default {
    props: {},
    data: () => ({}),
    methods: {},
    mounted() {
    }
}
</script>

<style scoped lang="scss">

</style>