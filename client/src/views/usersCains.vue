<template>
	<div>
		<div class="text-gray-400 flex gap-4 bg-gray-800 p-4">
			<button class="cursor-pointer hover:text-white" @click="showcase">
				Showcase
			</button>
			<button class="cursor-pointer hover:text-white" @click="publicProfile">
				Public
			</button>
			<button class="cursor-pointer hover:text-white" @click="loved">
				Loved
			</button>
			<button class="cursor-pointer hover:text-white" @click="privateProfile">
				Private
			</button>
		</div>
		<RouterView />
	</div>
</template>

<script setup>
import { RouterView } from "vue-router";
import { useRouter } from "vue-router";

const router = useRouter();
const showcase = () => {
	router.push("/profile/cains/showcase");
};
const publicProfile = () => {
	router.push("/profile/cains/public");
};
const loved = () => {
	router.push("/profile/cains/loved");
};
const privateProfile = () => {
	router.push("/profile/cains/private");
};
</script>

<style scoped></style>
