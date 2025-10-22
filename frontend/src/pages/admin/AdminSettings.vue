<template>
  <q-page padding>
    <div class="q-pa-md" style="max-width: 600px; margin: auto;">
      <div class="text-h4 q-mb-md" style="text-align: center;">Configurações da Loja</div>

      <q-form @submit.prevent="saveSettings">
        <q-card flat bordered>
<q-card-section class="q-gutter-md">
            <q-input
              v-model="settings.nomeloja"
              label="Nome da Loja *"
              outlined
              :rules="[val => !!val || 'O nome é obrigatório']"
            />

            <q-file
              v-model="logoFile"
              label="Logo da Loja"
              outlined
              accept="image/*"
              clearable
              @clear="settings.logourl = null"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <div v-if="settings.logourl && !logoFile" class="text-center">
              <q-img
                :src="`http://localhost:3000${settings.logourl}`"
                style="height: 100px; max-width: 200px; border-radius: 4px;"
                fit="contain"
              />
              <div class="text-caption q-mt-xs">Logo Atual</div>
            </div>
            <q-input
              v-model="settings.chavepix"
              label="Chave PIX (opcional)"
              outlined
              hint="Será usada para gerar o QR Code dinâmico"
            />
            
            <div>
              <q-input
                v-model="settings.corprincipal"
                label="Cor Principal *"
                outlined
                :rules="[val => !!val || 'A cor é obrigatória']"
                hint="Use o formato hexadecimal (ex: #E99DE9)"
              >
                <template v-slot:append>
                  <q-icon name="colorize" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-color v-model="settings.corprincipal" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <div class="q-mt-xs" :style="{ backgroundColor: settings.corprincipal, height: '20px', borderRadius: '4px' }"></div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              type="submit"
              label="Salvar Alterações"
              color="primary"
              :loading="saving"
            />
          </q-card-actions>
        </q-card>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const settings = ref({
  nomeloja: '',
  logourl: '',
  corprincipal: '#D9A6A1',
  chavepix: '',
});
const loading = ref(true);
const saving = ref(false);

const logoFile = ref(null);

async function fetchSettings() {
  loading.value = true;
  try {
    const response = await axios.get('/api/admin/configuracoes');
    settings.value = response.data;
    logoFile.value = null; 
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    $q.notify({ color: 'negative', message: 'Não foi possível carregar as configurações.' });
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  try {
    let finalLogoUrl = settings.value.logourl; 

    if (logoFile.value) {
      const formData = new FormData();
      formData.append('image', logoFile.value);

      const uploadResponse = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      finalLogoUrl = uploadResponse.data.imageUrl; 
    }

    const settingsPayload = {
      ...settings.value,
      logourl: finalLogoUrl,
    };

    await axios.put('/api/admin/configuracoes', settingsPayload);

    settings.value = settingsPayload;
    logoFile.value = null;

    $q.notify({ color: 'positive', message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    $q.notify({ color: 'negative', message: 'Erro ao salvar as configurações.' });
  } finally {
    saving.value = false;
  }
}

onMounted(fetchSettings);
</script>