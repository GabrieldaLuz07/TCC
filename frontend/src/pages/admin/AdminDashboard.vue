<template>
  <q-page padding>
    <div class="text-h4 q-mb-md text-weight-bold">Painel de Controle</div>
    <div class="text-subtitle1 text-grey-8 q-mb-lg">
      Olá! O que você gostaria de fazer hoje?
    </div>

    <div class="q-gutter-lg row items-start">

      <q-card class="dashboard-card cursor-pointer" flat bordered @click="goTo('/admin/pedidos')">
        <q-card-section class="text-center">
          <q-icon name="receipt_long" color="primary" size="64px" />
          <div class="text-h6 q-mt-sm">Conferir Pedidos</div>
          <div class="text-caption text-grey">
            Visualize e gerencie os pedidos recebidos.
          </div>
        </q-card-section>
      </q-card>

      <q-card class="dashboard-card cursor-pointer" flat bordered @click="goTo('/admin/produtos')">
        <q-card-section class="text-center">
          <q-icon name="add_shopping_cart" color="primary" size="64px" />
          <div class="text-h6 q-mt-sm">Gerenciar Produtos</div>
          <div class="text-caption text-grey">
            Adicione, edite ou remova itens do seu cardápio.
          </div>
        </q-card-section>
      </q-card>

      <q-card class="dashboard-card cursor-pointer" flat bordered @click="goTo('/cardapio', true)">
        <q-card-section class="text-center">
          <q-icon name="restaurant_menu" color="primary" size="64px" />
          <div class="text-h6 q-mt-sm">Ver Cardápio Público</div>
          <div class="text-caption text-grey">
            Acesse a visão do cardápio como seus clientes o veem.
          </div>
        </q-card-section>
      </q-card>

      <q-card class="dashboard-card cursor-pointer" flat bordered @click="goTo('/admin/configuracoes')">
        <q-card-section class="text-center">
          <q-icon name="settings" color="primary" size="64px" />
          <div class="text-h6 q-mt-sm">Configurações</div>
          <div class="text-caption text-grey">
            Personalize nome, logo, cor e PIX da loja.
          </div>
        </q-card-section>
      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goTo = (path, newTab = false) => {
  if (newTab) {
    const routeData = router.resolve({ path });
    window.open(routeData.href, '_blank');
  } else {
    router.push(path);
  }
};
</script>

<style scoped>
.dashboard-card {
  width: 100%;
  max-width: 250px;
  min-height: 200px;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}
</style>