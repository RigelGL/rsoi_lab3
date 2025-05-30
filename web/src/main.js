import { createRouter, createWebHistory } from 'vue-router'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


import App from './App.vue'
import HomeView from "@/views/HomeView.vue";
import AuthView from "@/views/auth/AuthView.vue";
import AuthCallback from "@/views/auth/AuthCallback.vue";
import HotelsView from "@/views/HotelsView.vue";
import ReservationsView from "@/views/ReservationsView.vue";
import ProfileView from "@/views/ProfileView.vue";
import HotelView from "@/views/HotelView.vue";
import ReservationView from "@/views/ReservationView.vue";
import AdminPersonsView from "@/views/admin/AdminPersonsView.vue";
import AdminPage from "@/views/admin/AdminPage.vue";
import AdminHotelsView from "@/views/admin/AdminHotelsView.vue";
import AdminPersonView from "@/views/admin/AdminPersonView.vue";
import AdminKafka from "@/views/admin/AdminKafka.vue";
import { parseJwt } from "@/utils.js";


const vuetify = createVuetify({
    components,
    directives,
});

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/login', name: 'authorize', component: AuthView, meta: { layout: 'auth', guest: true} },
        { path: '/callback', name: 'callback', component: AuthCallback, meta: { layout: 'auth', guest: true } },
        { path: '/hotels', name: 'hotels', component: HotelsView },
        { path: '/hotel/:uid', name: 'hotel', component: HotelView },
        { path: '/reservations', name: 'reservations', component: ReservationsView },
        { path: '/reservation/:uid', name: 'reservation', component: ReservationView },
        { path: '/profile', name: 'profile', component: ProfileView },

        { path: '/admin', name: 'admin', component: AdminPage },
        { path: '/admin/persons', name: 'admin-persons', component: AdminPersonsView },
        { path: '/admin/person/:uid', name: 'admin-person', component: AdminPersonView },
        { path: '/admin/hotels', name: 'admin-hotels', component: AdminHotelsView },
        { path: '/admin/kafka', name: 'admin-kafka', component: AdminKafka },
    ],
});

router.beforeEach((to, from, next) => {
    if (to.meta?.guest) {
        if (localStorage.getItem('token'))
            return next('/');
    }
    else if (!to.meta?.guest) {
        if (!localStorage.getItem('token'))
            return next('/login');
    }

    if(to.path.startsWith('/admin') && parseJwt(localStorage.getItem('token'))?.role !== 'admin') {
        return next('/');
    }
    return next();
})

createApp(App)
    .use(createPinia())
    .use(vuetify)
    .use(router)
    .mount('#app');
