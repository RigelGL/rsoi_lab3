<template>
    <v-card>
        <v-card-title>Пользователь</v-card-title>
        <v-card-text>
            {{ person }}
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    props: {},
    data: () => ({
        person: null,
    }),
    methods: {},
    mounted() {

    }
}
</script>

<style scoped lang="scss">

</style>