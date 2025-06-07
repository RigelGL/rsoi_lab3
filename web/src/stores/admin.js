import { defineStore } from 'pinia'
import api from '../axios.js'

export const useAdminStore = defineStore('admin', {
    actions: {
        addHotel(data) {
            return api.post('hotels', data);
        },
        getHotels(page, limit, search) {
            return api.get('hotels?page=' + page + '&limit=' + limit + '&search=' + search);
        },
        getPersons(page, limit, search) {
            return api.get('persons?page=' + page + '&limit=' + limit + '&search=' + search);
        },
        searchLogs(search) {
            return api.get(`logs?s=${JSON.stringify(search)}`);
        },
    }
})
