<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-amber-400">⚙️ Admin-Verwaltung</h2>

    <!-- Station anlegen -->
    <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold">Neue Station anlegen</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input v-model="newStation.name" placeholder="Name (z.B. Slalom)" class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
        <select v-model="newStation.scoring_type" class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white">
          <option value="points">Punkte (Höher ist besser)</option>
          <option value="time">Zeit (Niedriger ist besser)</option>
        </select>
        <button @click="addStation" class="bg-purple-600 hover:bg-purple-500 rounded py-2 font-semibold">Station Hinzufügen</button>
      </div>
    </div>

    <!-- Teilnehmer anlegen -->
    <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold">Neuen Teilnehmer anlegen</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input v-model.number="newParticipant.start_number" type="number" placeholder="Startnummer" class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
        <input v-model="newParticipant.name" placeholder="Name / Pup" class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
        <button @click="addParticipant" class="bg-blue-600 hover:bg-blue-500 rounded py-2 font-semibold">Teilnehmer Hinzufügen</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const newStation = ref({ name: '', scoring_type: 'points', unit: '' });
const newParticipant = ref({ start_number: null, name: '' });

async function addStation() {
  if (!newStation.value.name) return;
  const token = localStorage.getItem('token');
  await axios.post('/api/stations', newStation.value, { headers: { Authorization: `Bearer ${token}` } });
  newStation.value = { name: '', scoring_type: 'points', unit: '' };
  alert('Station angelegt!');
}

async function addParticipant() {
  if (!newParticipant.value.start_number || !newParticipant.value.name) return;
  const token = localStorage.getItem('token');
  await axios.post('/api/participants', newParticipant.value, { headers: { Authorization: `Bearer ${token}` } });
  newParticipant.value = { start_number: null, name: '' };
  alert('Teilnehmer angelegt!');
}
</script>