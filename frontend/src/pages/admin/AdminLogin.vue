<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-md" style="width: 100%; max-width: 450px;">
      <q-card-section>
        <div class="text-h5 text-center text-weight-bold">Acesso da Confeiteira</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="login">
          <q-input
            outlined
            :model-value="cpfCnpj"
            @update:model-value="onInputCpfCnpj"
            label="CPF / CNPJ"
            class="q-mb-md"
            lazy-rules
            :rules="[val => !!val || 'Campo obrigatório']"
          />

          <q-input
            outlined
            v-model="senha"
            :type="isPwdVisible ? 'text' : 'password'"
            label="Senha"
            class="q-mb-lg"
            lazy-rules
            :rules="[val => !!val || 'Campo obrigatório']"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwdVisible ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwdVisible = !isPwdVisible"
              />
            </template>
          </q-input>

          <q-banner v-if="errorMessage" inline-actions class="text-white bg-red q-mb-md" rounded>
            {{ errorMessage }}
            <template v-slot:action>
              <q-btn flat dense color="white" icon="close" @click="errorMessage = ''" />
            </template>
          </q-banner>

          <q-btn
            label="Entrar"
            type="submit"
            color="primary"
            class="full-width"
            size="lg"
            unelevated
            :loading="loading"
          >
            <template v-slot:loading>
              <q-spinner-hourglass class="on-left" />
              Verificando...
            </template>
          </q-btn>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const cpfCnpj = ref('');
const senha = ref('');
const isPwdVisible = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const router = useRouter();

async function login() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const documento = cpfCnpj.value.replace(/\D/g, '');

    const response = await axios.post('/api/admin/login', {
      documento: documento,
      senha: senha.value
    });

    const token = response.data.token;

    localStorage.setItem('authToken', token);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await router.push('/admin/dashboard');

  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
    }
    console.error("Falha no login:", error);
  } finally {
    loading.value = false;
  }
}

function onInputCpfCnpj(value) {
  let v = value.replace(/\D/g, '');
  if (v.length > 14) v = v.substring(0, 14);

  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  }
  cpfCnpj.value = v;
}
</script>

<style scoped>
.q-page {
  background-color: #f0f2f5;
}
</style>