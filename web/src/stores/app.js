import { defineStore } from 'pinia'
import api from '../axios.js'

export const useAppStore = defineStore('app', {
    actions: {
        searchHotels(page, limit, search) {
            return api.get('hotels?page=' + page + '&limit=' + limit + '&search=' + search);
        },
        getHotel(uid) {
            return api.get(`hotels/${uid}`);
        },
    }
})
