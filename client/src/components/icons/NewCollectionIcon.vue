<template>
  <svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    :class="customClass"
  >
    <rect height="9.64" rx="1" width="9.64" y="10.36"></rect>
    <rect height="9.64" rx="1" width="9.64" x="10.36" y="10.36"></rect>
    <rect height="9.64" rx="1" width="9.64"></rect>
    <rect height="9.64" rx="1" width="9.64" x="10.36"></rect>
  </svg>
</template>

<script>
export default {
  name: "NewCollectionIcon",
  props: {
    customClass: {
      type: String,
      default: ""
    }
  }
};
</script>
