<template>
  <div class="max-w-md mx-auto mt-12 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
    <h2 class="text-2xl font-bold text-center mb-6 text-slate-100">Helfer & Admin Login</h2>
    
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1 text-slate-300">Benutzername</label>
        <input v-model="username" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-slate-300">Passwort</label>
        <input v-model="password" type="password" required class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
      </div>

      <p v-if="error" class="text-red-400 text-sm text-center">{{ error }}</p>

      <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded font-semibold transition">
        Anmelden
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

async function handleLogin() {
  error.value = '';
  try {
    const res = await axios.post('/api/login', { username: username.value, password: password.value });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('username', res.data.username);
    localStorage.setItem('role', res.data.role);

    if (res.data.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/helper');
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Login fehlgeschlagen';
  }
}
</script>