<template>
  <svg
    viewBox="0 0 20 22"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    :class="customClass"
  >
    <path
      d="M10.83 2.5H19a1 1 0 1 1 0 2h-8.17a3.001 3.001 0 0 1-5.66 0H1a1 1 0 0 1 0-2h4.17a3.001 3.001 0 0 1 5.66 0zM1 10.5a1 1 0 1 0 0 2h10.17a3.001 3.001 0 0 0 5.66 0H19a1 1 0 1 0 0-2h-2.17a3.001 3.001 0 0 0-5.66 0zm-1 8a1 1 0 0 1 1-1h2.17a3.001 3.001 0 0 1 5.66 0H19a1 1 0 1 1 0 2H8.83a3.001 3.001 0 0 1-5.66 0H1a1 1 0 0 1-1-1z"
    />
  </svg>
</template>

<script>
export default {
  name: "FiltersIcon",
  props: {
    customClass: {
      type: String,
      default: ''
    }
  }
};
</script>
