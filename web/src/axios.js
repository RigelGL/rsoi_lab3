import axios from 'axios'
import { useUserStore } from "@/stores/user.js";

const axiosInstance = axios.create({
    baseURL: `${location.protocol}//${location.host}/api/v1/`,
    headers: { 'Content-Type': 'application/json' }
})

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token)
            config.headers.Authorization = `Bearer ${token}`;
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

axiosInstance.interceptors.response.use(
    (response) => {
        return { status: response.status, data: response.data };
    },
    (error) => {
        if (error.response.status === 401)
            useUserStore().logout();
        return Promise.resolve({ status: error.response.status, data: error.response.data });
    }
)

export default axiosInstance