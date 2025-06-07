<template>
    <v-card>
        <v-card-title>Пользователи</v-card-title>
        <v-card-text>
            <v-table density="compact">
                <thead>
                <tr>
                    <td style="width: 50px">#</td>
                    <td>Sub</td>
                    <td>Имя</td>
                    <td>Логин</td>
                    <td>Возраст</td>
                    <td>Адрес</td>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(e, i) in persons">
                    <td>{{ i + 1 }}</td>
                    <td>{{ e.id }}</td>
                    <td>{{ e.name }}</td>
                    <td>{{ e.login }}</td>
                    <td>{{ e.age }}</td>
                    <td>{{ e.address }}</td>
                </tr>
                </tbody>
            </v-table>

            <v-btn @click="dialog = true" v-if="false">Добавить</v-btn>

            <v-dialog v-model="dialog">
                <v-card>
                    <v-card-title>Добавить пользователя</v-card-title>
                </v-card>
            </v-dialog>
        </v-card-text>
    </v-card>
</template>

<script>
import { useAdminStore } from "@/stores/admin.js";

export default {
    props: {},
    data: () => ({
        persons: [],
        dialog: false,
        add: {
            name: '',
            login: '',
            password: '',
            age: 0,
            address: '',
        },
    }),
    methods: {
        loadAll() {
            this.store.getPersons(1, 20, '').then(e => {
                if (e.status === 200)
                    this.persons = e.data;
            });
        },
        addPerson() {

        }
    },
    mounted() {
        this.loadAll();
    },
    setup() {
        return { store: useAdminStore() }
    }
}
</script>

<style scoped lang="scss">

</style>