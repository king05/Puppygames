<template>
  <div class="space-y-6">
    <div class="text-center py-4 bg-slate-800/60 rounded-xl border border-slate-700">
      <h2 class="text-3xl font-extrabold text-amber-400 tracking-wider">🏆 LIVE RANGLISTE</h2>
      <p class="text-slate-400 text-sm mt-1">Stand aktualisiert sich automatisch bei Punkteeingabe</p>
    </div>

    <div class="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
      <table class="w-full text-left">
        <thead class="bg-slate-900/80 text-slate-400 uppercase text-xs">
          <tr>
            <th class="p-4 text-center">Rang</th>
            <th class="p-4 text-center">Start-Nr.</th>
            <th class="p-4">Name / Pup</th>
            <th class="p-4 text-right">Gesamtpunkte</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700">
          <tr 
            v-for="item in leaderboard" 
            :key="item.id"
            :class="{
              'bg-amber-500/10 font-bold text-amber-300': item.overall_rank === 1,
              'bg-slate-300/10 font-bold text-slate-200': item.overall_rank === 2,
              'bg-amber-700/10 font-bold text-amber-600': item.overall_rank === 3,
            }"
            class="hover:bg-slate-700/50 transition-colors text-lg"
          >
            <td class="p-4 text-center font-black">
              <span v-if="item.overall_rank === 1">🥇 1</span>
              <span v-else-if="item.overall_rank === 2">🥈 2</span>
              <span v-else-if="item.overall_rank === 3">🥉 3</span>
              <span v-else>#{{ item.overall_rank }}</span>
            </td>
            <td class="p-4 text-center font-mono">#{{ item.start_number }}</td>
            <td class="p-4 font-semibold">{{ item.name }}</td>
            <td class="p-4 text-right font-black text-amber-400 text-xl">
              {{ item.total_points }} Pkt.
            </td>
          </tr>
          <tr v-if="leaderboard.length === 0">
            <td colspan="4" class="p-8 text-center text-slate-500">
              Noch keine Teilnehmer oder Ergebnisse vorhanden.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import axios from 'axios';

const leaderboard = ref([]);
let socket = null;

onMounted(async () => {
  try {
    const res = await axios.get('/api/leaderboard');
    leaderboard.value = res.data;
  } catch (err) {
    console.error('Fehler beim Laden der Rangliste:', err);
  }

  socket = io();
  socket.on('leaderboard_update', (data) => {
    leaderboard.value = data;
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
});
</script>