<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 700px; max-width: 80vw;">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6">Detalhes do Pedido #{{ pedido.idpedido }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-md">
        <div style="margin-bottom: 20px;;">
          <div class="text-subtitle2 text-grey-8">Cliente</div>
          <div><strong>{{ pedido.nomecliente }}</strong></div>
          <div>{{ pedido.contatocliente }}</div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-subtitle2 text-grey-8">Data do Pedido</div>
            <div>{{ formatarData(pedido.datapedido) }}</div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-subtitle2 text-grey-8">Data da {{ pedido.metodoentrega || 'Não especificado' }}</div>
            <div class="text-weight-bold">{{ formatarData(pedido.dataentrega) }}</div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <div class="text-capitalize"><strong>{{ pedido.metodoentrega || 'Não especificado' }}</strong></div>

          <div v-if="pedido.metodoentrega === 'entrega' && pedido.enderecorua" class="q-mt-sm text-caption text-grey-8">
            <div class="row items-center no-wrap">
              <q-icon name="place" class="q-mr-xs" />
              <span>{{ pedido.enderecorua }}, {{ pedido.endereconumero }} - {{ pedido.enderecobairro }}</span>
            </div>
            <div class="q-ml-lg">{{ pedido.enderecocidade }}</div>
            <div v-if="pedido.enderecocomplemento" class="q-ml-lg">Complemento: {{ pedido.enderecocomplemento }}</div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle2 text-grey-8 q-mb-sm">Itens do Pedido</div>
        <q-list bordered separator>
          <q-item v-for="item in pedido.items" :key="item.iditempedido">
            
            <q-item-section>
              <q-item-label>{{ item.nomeproduto }}</q-item-label>
              
              <q-item-label caption v-if="item.descricaopersonalizada">
                {{ item.descricaopersonalizada }}
              </q-item-label>
              
            </q-item-section>
            
            <q-item-section side>
              <div>x{{ item.quantidade }}</div>
            </q-item-section>

            <q-item-section side>
              <div v-if="item.precopromocional && item.precopromocional > 0">
                
                <div class="text-caption text-grey text-strike text-right">
                  {{ formatCurrency(item.precooriginal) }}
                </div>
                
                <div class="text-weight-medium text-negative">
                  {{ formatCurrency(item.precopromocional) }}
                </div>

              </div>

              <div v-else>
                <div class="text-weight-medium">
                  {{ formatCurrency(item.precooriginal) }}
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row justify-end text-h6 text-weight-bold">
          Total: {{ formatCurrency(pedido.valortotal) }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" label="Fechar" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar';
import { date } from 'quasar';

defineProps({
  pedido: {
    type: Object,
    required: true
  }
});

function formatarData(dataString) {
  if (!dataString) return 'Não especificada';
  return date.formatDate(dataString, 'DD/MM/YYYY');
}

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const formatCurrency = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
</script>