<template>
    <v-app>
        <component :is="currentLayout" v-if="isRouterLoaded">
            <router-view/>
        </component>
    </v-app>
</template>

<script>

import authLayout from "@/layout/AuthLayout.vue";
import errorLayout from "@/layout/ErrorLayout.vue";
import defaultLayout from "@/layout/DefaultLayout.vue";

export default {
    components: {
        authLayout,
        errorLayout,
        defaultLayout,
    },
    computed: {
        isRouterLoaded: function () {
            return this.$route.name !== null;
        },
        currentLayout: function () {
            return `${this.$route.meta.layout || 'default'}Layout`;
        }
    },
}
</script>

<style>

</style>
