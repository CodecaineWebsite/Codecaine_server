import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // 預設 base URL
});

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.idToken;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
