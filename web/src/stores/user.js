import { defineStore } from 'pinia'
import api from '../axios.js'
import { parseJwt } from "@/utils.js";


export const useUserStore = defineStore('user', {
    state: () => ({ user: null, role: null }),
    actions: {
        login(type, login, password) {
            return new Promise(resolve => {
                api.post('authorize', { type, login, password }).then(e => {
                    const token = e.data?.token || e.data?.jwt || '';
                    if (e.status === 200 && token) {
                        this.role = parseJwt(token)?.role;
                        localStorage.setItem('token', token);
                    }
                    resolve(e);
                });
            });
        },

        logout() {
            this.user = undefined;
            this.role = null;
            console.log('logout');
        },

        callback(code) {
            return new Promise(resolve => {
                api.get(`callback?code=${code}`).then(e => {
                    if (e.status === 200 && e.data?.token)
                        localStorage.setItem('token', e.data.token);
                    resolve(e);
                });
            });
        },

        getMe() {
            return new Promise(resolve => api.get('me').then(e => {
                if (e.status === 200) {
                    this.user = e.data;
                    this.role = parseJwt(localStorage.getItem('token'))?.role;
                }
                else if (e.status === 401 || e.status === 403)
                    this.logout();
                resolve(e);
            }));
        },
        getMyReservations() {
            return api.get('reservations');
        },
        getMyReservation(uid) {
            return api.get(`reservations/${uid}`);
        },
        cancelMyReservation(uid) {
            return api.delete(`reservations/${uid}`);
        },
        getMyLoyalty() {
            return api.get('loyalty');
        },


        confirmReservation(hotelUid, startDate, endDate) {
            return api.post('reservations', { hotelUid, startDate, endDate });
        }
    },
})
