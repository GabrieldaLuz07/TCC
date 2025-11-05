<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 500px; max-width: 80vw;">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6">Situação do Pedido #{{ pedido.idpedido }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-lg text-center">
        <div class="text-subtitle1 text-grey-8">Status Atual:</div>
        <q-badge :color="getStatusColor(pedido.status)" outline class="q-pa-md text-h6">
          {{ pedido.status }}
        </q-badge>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-subtitle2 text-grey-8">Cliente</div>
            <div><strong>{{ pedido.nomecliente }}</strong></div>
          </div>
          <div class="col-6">
            <div class="text-subtitle2 text-grey-8">Data da Entrega/Retirada</div>
            <div class="text-weight-bold">{{ formatarData(pedido.dataentrega) }}</div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle2 text-grey-8 q-mb-sm">Resumo dos Itens</div>
        <q-list bordered separator>
          <q-item v-for="item in pedido.items" :key="item.iditempedido">
            <q-item-section>
              <q-item-label>{{ item.nomeproduto }}</q-item-label>
              <q-item-label caption v-if="item.descricaopersonalizada">
                {{ item.descricaopersonalizada }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div>x{{ item.quantidade }}</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" label="Fechar" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar';
import { getStatusColor, formatarData } from 'src/utils/helpers.js';

defineProps({
  pedido: {
    type: Object,
    required: true
  }
});

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
</script>