<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-table title="Pedidos Recebidos" :rows="pedidos" :columns="columns" row-key="idpedido" :loading="loading" no-data-label="Nenhum pedido encontrado." rows-per-page-label="Pedidos por página">
        <template v-slot:top-right>
          <q-btn
            color="primary"
            icon="sync"
            label="Atualizar"
            :loading="loading"
            @click="fetchPedidos"
          >
            <template v-slot:loading>
              <q-spinner-puff />
            </template>
          </q-btn>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.value)" outline>
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-valortotal="props">
          <q-td :props="props">
            {{ formatCurrency(props.value) }}
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="visibility" @click="viewDetails(props.row)" />
            <q-btn flat dense round icon="edit" class="q-ml-sm" @click="changeStatus(props.row)" />
            <q-btn flat dense round icon="delete" color="negative" class="q-ml-sm" @click="confirmDeleteOrder(props.row)"/>
          </q-td>
        </template>

        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>

      </q-table>
    </div>

    <q-dialog v-model="editDialogVisible">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Alterar Status do Pedido #{{ selectedOrder?.id }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>Cliente: <strong>{{ selectedOrder?.nomecliente }}</strong></p>
          <p>Status Atual:
            <q-badge :color="getStatusColor(selectedOrder?.status)" outline>
              {{ selectedOrder?.status }}
            </q-badge>
          </p>
          <q-select outlined v-model="newStatus" :options="statusOptions" label="Novo Status" emit-value map-options/>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn label="Salvar" color="primary" @click="updateOrderStatus" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useQuasar } from 'quasar';
import OrderDetailsDialog from 'src/components/OrderDetailsDialog.vue';

const $q = useQuasar();
const pedidos = ref([]);
const loading = ref(false);

const editDialogVisible = ref(false);
const selectedOrder = ref(null);
const newStatus = ref('');
const statusOptions = ['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Finalizado', 'Cancelado'];

const columns = [
  { name: 'idpedido', required: true, label: 'Pedido #', align: 'left', field: 'idpedido', sortable: true },
  { name: 'nomecliente', label: 'Cliente', align: 'left', field: 'nomecliente', sortable: true },
  { name: 'status', label: 'Status', align: 'center', field: 'status', sortable: true },
  { name: 'valortotal', label: 'Valor Total', align: 'right', field: 'valortotal', sortable: true },
  { name: 'datapedido', label: 'Data do Pedido', align: 'left', field: row => new Date(row.datapedido).toLocaleString('pt-BR'), sortable: true },
  { name: 'actions', label: 'Ações', align: 'center', field: 'id' }
];

async function fetchPedidos() {
  loading.value = true;
  try {
    const response = await axios.get('/api/admin/pedidos');
    console.log(response.data);
    pedidos.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    $q.notify({
      color: 'negative',
      position: 'top',
      message: 'Falha ao carregar os pedidos. Tente novamente.',
      icon: 'report_problem'
    });
  } finally {
    loading.value = false;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Pendente': return 'orange';
    case 'Em Preparo': return 'blue';
    case 'Finalizado': return 'green';
    case 'Cancelado': return 'red';
    default: return 'grey';
  }
}

function formatCurrency(value) {
  const val = Number(value);
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function viewDetails(pedido) {
  $q.dialog({
    component: OrderDetailsDialog,
    componentProps: {
      pedido: pedido
    }
  });
}

function changeStatus(pedido) {
  selectedOrder.value = { ...pedido };
  newStatus.value = pedido.status;
  editDialogVisible.value = true; 
}

async function updateOrderStatus() {
  if (!selectedOrder.value || !newStatus.value) return;

  try {
    const response = await axios.put(`/api/admin/pedidos/${selectedOrder.value.idpedido}`, {
      status: newStatus.value
    });

    const index = pedidos.value.findIndex(p => p.idpedido === selectedOrder.value.idpedido);
    if (index !== -1) {
      pedidos.value[index] = response.data;
    }

    $q.notify({
      color: 'positive',
      position: 'top',
      message: 'Status do pedido atualizado com sucesso!',
      icon: 'check_circle'
    });

    editDialogVisible.value = false;

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    $q.notify({
      color: 'negative',
      position: 'top',
      message: 'Falha ao atualizar o status. Tente novamente.',
      icon: 'report_problem'
    });
  }
}

function confirmDeleteOrder(pedido) {
  $q.dialog({
    title: 'Confirmar Exclusão',
    message: `Você tem certeza que deseja excluir permanentemente o pedido #${pedido.idpedido} do cliente "${pedido.nomecliente}"?`,
    cancel: {
      label: 'Cancelar',
      flat: true,
    },
    ok: {
      label: 'Excluir',
      color: 'negative',
      unelevated: true,
    },
    persistent: true
  }).onOk(() => {
    deleteOrder(pedido.idpedido);
  });
}

async function deleteOrder(pedidoId) {
  try {
    await axios.delete(`/api/admin/pedidos/${pedidoId}`);
    
    $q.notify({
      color: 'positive',
      position: 'top',
      message: 'Pedido excluído com sucesso!',
      icon: 'check_circle'
    });

    pedidos.value = pedidos.value.filter(p => p.idpedido !== pedidoId);

  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    $q.notify({
      color: 'negative',
      position: 'top',
      message: 'Falha ao excluir o pedido. Tente novamente.',
      icon: 'report_problem'
    });
  }
}

onMounted(() => {
  fetchPedidos();
});
</script>

<style scoped>
.q-table__title {
  font-size: 1.5rem;
  font-weight: bold;
}
</style>