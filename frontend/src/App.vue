<template>
  <div class="min-h-screen flex flex-col font-sans">
    <header class="bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
      <h1 class="text-xl font-bold text-amber-400 flex items-center gap-2">
        🐶 Puppy Games
      </h1>
      <nav class="flex items-center gap-3">
        <router-link to="/beamer" class="text-sm px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600">Beamer</router-link>
        <router-link v-if="isLoggedIn" to="/helper" class="text-sm px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500">Helfer</router-link>
        <router-link v-if="isAdmin" to="/admin" class="text-sm px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500">Admin</router-link>
        <router-link v-if="!isLoggedIn" to="/login" class="text-sm px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600">Login</router-link>
        <button v-else @click="logout" class="text-sm px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-600">Logout</button>
      </nav>
    </header>

    <main class="flex-1 p-4 max-w-7xl w-full mx-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const role = ref(localStorage.getItem('role') || '');
const isLoggedIn = computed(() => !!localStorage.getItem('token'));
const isAdmin = computed(() => role.value === 'admin');

function logout() {
  localStorage.clear();
  role.value = '';
  router.push('/login');
}
</script>