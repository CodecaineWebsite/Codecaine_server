import { defineStore } from "pinia";
import { ref } from "vue";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../config/firebase"; //

export const useAuthStore = defineStore("auth", () => {
  const idToken = ref(localStorage.getItem("idToken") || "");
  const user = ref(null);
  function setToken(token) {
    idToken.value = token;
    localStorage.setItem("idToken", token);
  }

  function clearToken() {
    idToken.value = "";
    localStorage.removeItem("idToken");
  }

  return { idToken, user, setToken, clearToken };
});
