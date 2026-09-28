<template>
  <div class="max-w-lg mx-auto space-y-6">
    <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
      <h2 class="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2">
        📝 Punkte / Zeiten erfassen
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-300">Station wählen</label>
          <select v-model="selectedStationId" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-white">
            <option value="" disabled>-- Bitte Station wählen --</option>
            <option v-for="s in stations" :key="s.id" :value="s.id">
              {{ s.name }} ({{ s.scoring_type === 'time' ? 'Zeit' : 'Punkte' }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-slate-300">Teilnehmer wählen</label>
          <select v-model="selectedParticipantId" class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-white">
            <option value="" disabled>-- Bitte Teilnehmer wählen --</option>
            <option v-for="p in participants" :key="p.id" :value="p.id">
              #{{ p.start_number }} - {{ p.name }}
            </option>
          </select>
        </div>

        <div v-if="currentStation">
          <label class="block text-sm font-medium mb-1 text-slate-300">
            Ergebnis ({{ currentStation.scoring_type === 'time' ? 'Zeit in Sek.' : 'Punkte / Anzahl' }})
          </label>
          <input 
            v-model.number="rawValue" 
            type="number" 
            step="0.01" 
            placeholder="z. B. 42.5" 
            class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-3 text-2xl font-mono text-amber-400 focus:outline-none" 
          />
        </div>

        <p v-if="msg" :class="msgType === 'success' ? 'text-green-400' : 'text-red-400'" class="text-sm font-semibold text-center">
          {{ msg }}
        </p>

        <button 
          @click="saveScore" 
          :disabled="!selectedStationId || !selectedParticipantId || rawValue === null"
          class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 rounded-lg font-bold text-lg transition"
        >
          Ergebnis Speichern
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const stations = ref([]);
const participants = ref([]);
const selectedStationId = ref('');
const selectedParticipantId = ref('');
const rawValue = ref(null);
const msg = ref('');
const msgType = ref('success');

const currentStation = computed(() => {
  return stations.value.find(s => s.id === selectedStationId.value);
});

onMounted(async () => {
  try {
    const [stRes, paRes] = await Promise.all([
      axios.get('/api/stations'),
      axios.get('/api/participants')
    ]);
    stations.value = stRes.data;
    participants.value = paRes.data;
  } catch (err) {
    console.error('Fehler beim Laden:', err);
  }
});

async function saveScore() {
  msg.value = '';
  try {
    const token = localStorage.getItem('token');
    await axios.post('/api/scores', {
      participant_id: selectedParticipantId.value,
      station_id: selectedStationId.value,
      raw_value: rawValue.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    msg.value = '✓ Ergebnis gespeichert!';
    msgType.value = 'success';
    rawValue.value = null;
    selectedParticipantId.value = '';
  } catch (err) {
    msg.value = 'Fehler beim Speichern';
    msgType.value = 'error';
  }
}
</script>