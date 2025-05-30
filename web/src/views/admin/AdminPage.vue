<template>
    <v-card style="width: 600px; margin: auto">
        <v-card-title>Админка</v-card-title>
        <v-card-text>
<!--            <v-btn to="/admin/hotels" variant="outlined">Отели</v-btn>-->
<!--            <v-btn to="/admin/persons" variant="outlined" class="ml-2">Пользователи</v-btn>-->
            <v-btn to="/admin/kafka" variant="outlined" class="ml-2">Кафка</v-btn>
        </v-card-text>
    </v-card>
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