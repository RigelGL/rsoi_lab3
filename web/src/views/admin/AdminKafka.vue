<template>
    <v-card>
        <v-card-title>
            Кафка
            <v-btn icon="mdi-reload" variant="flat" size="32" @click="shouldSearch = true"/>
        </v-card-title>
        <v-card-text v-if="!!error">
            <div style="font-size: 20px; color: #aa0000">
                {{ error }}
            </div>
        </v-card-text>
        <v-card-text v-else>
            <v-pagination :length="pages" v-model="page"/>

            <v-progress-linear indeterminate v-if="loading" height="4"/>
            <div style="height: 4px" v-else/>
            <v-table density="compact">
                <thead>
                <tr>
                    <td style="width: 50px">#</td>
                    <td style="width: 180px">Дата и время</td>
                    <td style="width: 180px" class="pt-2">
                        <v-select v-model="service" label="Сервис" variant="outlined" density="compact"
                                    :items="[null, 'gateway', 'reservation', 'person', 'payment', 'loyalty', 'auth']"/>
                    </td>
                    <td style="width: 160px" class="pt-2">
                        <v-combobox v-model="level" label="Тип" variant="outlined" density="compact"
                                    :items="[null, 'info', 'warning', 'error']"/>
                    </td>
                    <td class="pt-2">
                        <v-text-field v-model="message" label="Сообщение" clearable variant="outlined" density="compact"/>
                    </td>
                </tr>
                </thead>
                <tbody>
                <tr v-for="e in logs">
                    <td>{{ e.id }}</td>
                    <td>{{ new Date(e.timestamp).toISOString().substring(0, 19).replace('T', ' ') }}</td>
                    <td>{{ e.service }}</td>
                    <td :style="`color: ${colors[e.level] || '#000000'};`">[{{ e.level }}]</td>
                    <td>
                        <v-btn icon="mdi-eye" @click="selected = e; dialog = true" size="24" variant="flat"/>
                        {{ e.message.substring(0, 100) }}
                    </td>
                </tr>
                </tbody>
            </v-table>
        </v-card-text>

        <v-dialog v-model="dialog" width="800">
            <v-card>
                <v-card-title class="d-flex justify-space-between">
                    <div>
                        #{{ selected.id }}, {{ new Date(selected.timestamp).toISOString().substring(0, 19).replace('T', ' ') }}, {{ selected.service }}, [{{ selected.level }}]
                    </div>
                    <v-btn icon="mdi-close" @click="dialog = false" variant="flat"/>
                </v-card-title>
                <v-card-text style="font-size: 16px; font-weight: 400; line-height: 24px">
                    {{ selected.message }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import { useAdminStore } from "@/stores/admin.js";

export default {
    props: {},
    data: () => ({
        logs: [],
        count: 0,
        page: 1,
        pages: 1,
        limit: 20,
        service: '',
        level: '',
        message: '',

        timer: null,
        shouldSearch: true,
        error: null,
        loading: false,

        dialog: false,
        selected: {},

        colors: {
            info: '#14a6a6',
            warning: '#ca8d08',
            error: '#df1919',
        }
    }),
    watch: {
        page() {
            this.shouldSearch = true;
        },
        service() {
            this.page = 1;
            this.shouldSearch = true;
        },
        level() {
            this.page = 1;
            this.shouldSearch = true;
        },
        message() {
            this.page = 1;
            this.shouldSearch = true;
        }
    },
    methods: {
        runSearch() {
            if (!this.shouldSearch)
                return;
            this.error = null;
            this.shouldSearch = false;
            this.loading = true;
            this.store.searchLogs({
                page: this.page,
                limit: this.limit,
                service: this.service,
                level: this.level,
                message: this.message
            }).then(e => {
                this.loading = false;
                if (e.status !== 200)
                    return this.error = e.data?.error;
                this.logs = e.data.items;
                this.count = e.data.count;
                this.pages = Math.ceil(e.data.count / this.limit);
            });
        }
    },
    mounted() {
        this.timer = setInterval(() => this.runSearch(), 200);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    setup() {
        return { store: useAdminStore() }
    }
}
</script>

<style scoped lang="scss">

</style>