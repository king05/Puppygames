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

<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-amber-600 dark:text-amber-400">⚙️ Admin-Verwaltung</h2>
    </div>

    <!-- 📥 / 📤 CSV EXPORT & IMPORT SEKTION -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <h3 class="text-lg font-bold border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
        📂 Daten-Export & CSV-Import
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- EXPORT -->
        <div class="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <h4 class="font-semibold text-sm text-slate-600 dark:text-slate-300">Exportieren</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Exportiere die Gesamtergebnisse oder die Teilnehmerliste als CSV für Excel.
          </p>
          <div class="flex flex-wrap gap-2 pt-2">
            <button 
              @click="downloadCSV('/api/admin/export/results.csv', 'puppygames_ergebnisse.csv')"
              class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-semibold transition"
            >
              📊 Ergebnisse (CSV)
            </button>
            <button 
              @click="downloadCSV('/api/admin/export/participants.csv', 'puppygames_teilnehmer.csv')"
              class="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg font-semibold transition"
            >
              📋 Teilnehmerliste (CSV)
            </button>
          </div>
        </div>

        <!-- IMPORT -->
        <div class="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <h4 class="font-semibold text-sm text-slate-600 dark:text-slate-300">Teilnehmer per CSV importieren</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Format: <code>Startnummer;Name</code> (z.B. <code>101;Pup Milo</code>).
          </p>

          <input 
            type="file" 
            accept=".csv,.txt" 
            ref="fileInput"
            @change="handleFileUpload" 
            class="hidden" 
          />

          <button 
            @click="$refs.fileInput.click()" 
            class="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <span>📁 CSV-Datei auswählen</span>
          </button>

          <p v-if="importStatus" :class="importError ? 'text-red-500' : 'text-emerald-500'" class="text-xs font-semibold text-center">
            {{ importStatus }}
          </p>
        </div>
      </div>
    </div>

    <!-- ... (Hier folgen deine bisherigen Bereiche zum manuellen Anlegen von Stationen & Teilnehmern) ... -->
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const fileInput = ref(null);
const importStatus = ref('');
const importError = ref(false);

// CSV Download Funktion
async function downloadCSV(endpoint, defaultFilename) {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    alert('Fehler beim Herunterladen der CSV-Datei');
  }
}

// CSV Upload Funktion
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  importStatus.value = 'Wird verarbeitet...';
  importError.value = false;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const csvText = e.target.result;
      const token = localStorage.getItem('token');

      const res = await axios.post('/api/admin/import/participants', 
        { csvText }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      importStatus.value = `✓ Import erfolgreich: ${res.data.importedCount} hinzugefügt (${res.data.skippedCount} übersprungen/dupliziert)`;
      fileInput.value.value = ''; // Reset File input
    } catch (err) {
      importError.value = true;
      importStatus.value = err.response?.data?.error || 'Fehler beim Importieren der Datei.';
    }
  };

  reader.readAsText(file);
}
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-amber-600 dark:text-amber-400">⚙️ Admin-Verwaltung</h2>
    </div>

    <!-- 👥 HELFER- & NUTZERVERWALTUNG -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <h3 class="text-lg font-bold border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
        👥 Helfer- & Nutzerverwaltung
      </h3>

      <!-- Neuer Nutzer Formular -->
      <form @submit.prevent="createUser" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input 
          v-model="newUser.username" 
          type="text" 
          placeholder="Benutzername" 
          required 
          class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <input 
          v-model="newUser.password" 
          type="password" 
          placeholder="Passwort" 
          required 
          class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <select 
          v-model="newUser.role" 
          class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="helper">Helfer</option>
          <option value="admin">Admin</option>
        </select>
        <button 
          type="submit" 
          class="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-lg py-2 transition"
        >
          + Nutzer Anlegen
        </button>
      </form>

      <p v-if="userMsg" :class="userMsgError ? 'text-red-500' : 'text-emerald-500'" class="text-xs font-semibold">
        {{ userMsg }}
      </p>

      <!-- Nutzer Liste -->
      <div class="overflow-x-auto pt-2">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-xs">
            <tr>
              <th class="p-3">ID</th>
              <th class="p-3">Benutzername</th>
              <th class="p-3">Rolle</th>
              <th class="p-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700/50">
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td class="p-3 font-mono text-xs text-slate-400">#{{ user.id }}</td>
              <td class="p-3 font-semibold">{{ user.username }}</td>
              <td class="p-3">
                <span 
                  :class="user.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'"
                  class="px-2 py-0.5 rounded text-xs font-bold"
                >
                  {{ user.role === 'admin' ? 'Admin' : 'Helfer' }}
                </span>
              </td>
              <td class="p-3 text-right">
                <button 
                  @click="deleteUser(user)" 
                  class="text-red-500 hover:text-red-400 text-xs font-semibold hover:underline"
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ... (CSV-Import/Export, Stationen & Teilnehmer wie zuvor) ... -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const users = ref([]);
const newUser = ref({ username: '', password: '', role: 'helper' });
const userMsg = ref('');
const userMsgError = ref(false);

onMounted(() => {
  loadUsers();
});

async function loadUsers() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = res.data;
  } catch (err) {
    console.error('Fehler beim Laden der Benutzer:', err);
  }
}

async function createUser() {
  userMsg.value = '';
  userMsgError.value = false;
  try {
    const token = localStorage.getItem('token');
    await axios.post('/api/admin/users', newUser.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    userMsg.value = `✓ Benutzer "${newUser.value.username}" erfolgreich angelegt.`;
    newUser.value = { username: '', password: '', role: 'helper' };
    loadUsers();
  } catch (err) {
    userMsgError.value = true;
    userMsg.value = err.response?.data?.error || 'Fehler beim Anlegen des Benutzers.';
  }
}

async function deleteUser(user) {
  if (!confirm(`Möchtest du den Benutzer "${user.username}" wirklich löschen?`)) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(`/api/admin/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    loadUsers();
  } catch (err) {
    alert(err.response?.data?.error || 'Fehler beim Löschen des Benutzers.');
  }
}
</script>
