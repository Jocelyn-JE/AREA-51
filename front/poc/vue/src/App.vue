<script setup>
import { ref, onMounted } from "vue";

const data = ref(null);
const error = ref(null);

onMounted(async () => {
  try {
    const res = await fetch("http://localhost:8080/about.json");
    if (!res.ok) throw new Error("Failed to fetch backend");
    data.value = await res.json();
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<template>
  <div class="p-6 font-sans">
    <h1 class="text-2xl font-bold text-blue-600">AREA Vue PoC</h1>

    <div v-if="error" class="text-red-600 mt-4">
      Error: {{ error }}, try something else
    </div>

    <div v-else-if="!data" class="mt-4">Loading…</div>

    <div v-else class="mt-4">
      <p><strong>Client Host:</strong> {{ data.client.host }}</p>
      <p><strong>Server Time:</strong> {{ data.server.current_time }}</p>

      <h2 class="mt-6 font-semibold">Services</h2>
      <ul class="list-disc pl-6">
        <li v-for="service in data.server.services" :key="service.name">
          <p class="font-medium">{{ service.name }}</p>

          <p class="mt-2">Actions:</p>
          <ul class="list-inside list-disc ml-4">
            <li v-for="a in service.actions" :key="a.name">
              {{ a.name }} – {{ a.description }}
            </li>
          </ul>

          <p class="mt-2">Reactions:</p>
          <ul class="list-inside list-disc ml-4">
            <li v-for="r in service.reactions" :key="r.name">
              {{ r.name }} – {{ r.description }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
body {
  font-family: sans-serif;
}
</style>
