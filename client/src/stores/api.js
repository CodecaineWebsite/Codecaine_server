import axios from "axios";
import { getAuth } from "firebase/auth";

const api = axios.create({
	baseURL: "http://localhost:3000/", // 預設 base URL
});

api.interceptors.request.use(
	async (config) => {
		const auth = getAuth();
		const user = auth.currentUser;

		if (user) {
			const token = await user.getIdToken(); // 不要加參數 true，會自動 refresh 過期 token
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error)
);
export default api;
