<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-100">
		<div class="w-full max-w-md bg-white p-6 rounded shadow-md">
			<h2 class="text-2xl font-bold mb-4 text-center">登入</h2>

			<form @submit.prevent="login" class="text-black">
				<div class="mb-4">
					<label class="block font-bold mb-2">Email</label>
					<input
						v-model="email"
						type="email"
						class="w-full border px-3 py-2 rounded"
						required
					/>
				</div>

				<div class="mb-4 text-black-700">
					<label class="block text-black-700 font-bold mb-2">Password</label>
					<input
						v-model="password"
						type="password"
						class="w-full border px-3 py-2 rounded"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
				>
					登入
				</button>
			</form>

			<div
				v-if="authStore.idToken"
				class="mt-6 bg-gray-100 p-4 rounded text-sm"
			>
				<h3 class="font-semibold mb-2 text-black">JWT Token:</h3>
				<pre class="overflow-x-auto text-black">{{ authStore.idToken }}</pre>
			</div>
			<div
				class="mt-6 bg-gray-100 p-4 rounded text-sm text-black"
				v-if="authStore.idToken"
			>
				已登錄
			</div>
			<p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
		</div>
	</div>
</template>

<script setup>
import { ref } from "vue";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuthStore } from "../stores/useAuthStore";
import axios from "axios";

const email = ref("");
const password = ref("");
const error = ref("");
const authStore = useAuthStore();

async function login() {
	error.value = "";

	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email.value,
			password.value
		);

		const user = userCredential.user;
		const token = await user.getIdToken(); // 拿到 JWT
		authStore.setToken(token);
		console.log("登入成功，JWT:", token);
		alert("登入成功！"); // alert最後可以再調整美觀的樣式
		await syncUser();   // 原為 addUsers()
	} catch (e) {
		if (
			e.code === "auth/invalid-credential" ||
			e.code === "auth/wrong-password"
		) {
			error.value = "帳號或密碼錯誤，請重新輸入。";
		} else if (e.code === "auth/user-not-found") {
			error.value = "查無此帳號，請註冊或確認輸入。";
		} else {
			error.value = `登入失敗：${e.message}`;
		}
		console.error(e);
	}
}

async function syncUser() {  // 原為 addUsers， 改為 syncUser
	try {
		const res = await axios.get(
			"http://localhost:3000/api/auth/me", // 原為 POST http://localhost:3000/api/addusers , 改為 GET http://localhost:3000/api/auth/me

			{},
			{
				headers: {
					Authorization: `Bearer ${authStore.idToken}`,
				},
			}
		);

		console.log("身份驗證成功：", res.data);
	} catch (err) {
		console.error("身份驗證失敗：", err.response?.data || err.message);
	}
}

</script>
