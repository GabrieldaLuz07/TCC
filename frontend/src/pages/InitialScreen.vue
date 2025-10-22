<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="selection-card" flat bordered>
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold">Bem-vindo(a)!</div>
        <div class="text-subtitle1 text-grey-8">
          Como você gostaria de prosseguir?
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-y-md">
        <q-btn
          @click="goToCustomerView"
          color="primary"
          icon="storefront"
          label="Ver o Cardápio e Comprar"
          class="full-width"
          size="lg"
          unelevated
        />

        <q-btn
          @click="goToAdminLogin"
          color="deep-orange"
          icon="person"
          label="Sou a Confeiteira"
          class="full-width"
          size="lg"
          outline
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';

// Usando o Composition API do Vue 3
const router = useRouter();

const goToCustomerView = () => {
  router.push('/cardapio');
};

const goToAdminLogin = () => {
  router.push('/admin/login');
};
</script>

<style scoped>
.selection-card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
}

/* Opcional: Adicione um fundo bonito */
.q-page {
  /* Exemplo de fundo gradiente */
  /* background: linear-gradient(135deg, #f5e3e6, #dfe9f3); */

  /* Exemplo com imagem (adicione uma imagem em /src/assets) */
  /*
  background-image: url('~assets/background-confeitaria.jpg');
  background-size: cover;
  background-position: center;
  */
}
</style>