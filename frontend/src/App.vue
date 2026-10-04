<template>
    <div class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <!-- Header / Navigation -->
        <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🐶</span>
                        <h1 class="font-bold text-xl tracking-wide text-amber-600 dark:text-amber-400">Puppygames</h1>
                    </div>

                    <div class="flex items-center gap-2 sm:gap-4">
                        <!-- Navigation Links -->
                        <nav class="flex space-x-1 sm:space-x-2">
                            <router-link to="/beamer"
                                         class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                         :class="$route.path === '/beamer' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'">
                                📺 Beamer
                            </router-link>

                            <router-link to="/helper"
                                         class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                         :class="$route.path === '/helper' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'">
                                📝 Helfer
                            </router-link>

                            <router-link to="/admin"
                                         class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                         :class="$route.path === '/admin' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'">
                                ⚙️ Admin
                            </router-link>
                        </nav>

                        <!-- Dark / Light Mode Toggle Button -->
                        <button @click="toggleDarkMode"
                                class="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                :title="isDark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'">
                            <span v-if="isDark">☀️</span>
                            <span v-else>🌙</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <router-view />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isDark = ref(true);

function toggleDarkMode() {
  isDark.value = !isDark.value;
  updateTheme();
}

function updateTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

onMounted(() => {
  // Gespeichertes Theme laden oder Standard (Dark) verwenden
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
  } else {
    isDark.value = true; // Standard: Dunkel für Beamer/Event
  }
  updateTheme();
});
</script>