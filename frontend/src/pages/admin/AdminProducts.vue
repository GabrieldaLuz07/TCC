<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-table
        title="Meus Produtos"
        :rows="products"
        :columns="columns"
        row-key="idproduto"
        :loading="loading"
      >
        <template v-slot:top-right>
          <q-btn color="primary" icon="add" label="Adicionar Produto" @click="openAddDialog" />
        </template>

        <template v-slot:body-cell-preco="props">
          <q-td :props="props">
            {{ formatCurrency(props.row.preco) }} / {{ props.row.unidademedida }}
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" @click="openEditDialog(props.row)" />
            <q-btn flat dense round icon="delete" color="negative" class="q-ml-sm" @click="confirmDelete(props.row)" />
          </q-td>
        </template>

        <template v-slot:body-cell-disponivel="props">
          <q-td :props="props">
            <q-toggle :model-value="props.value" @update:model-value="updateAvailability(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="productDialogVisible">
      <q-card style="width: 600px; max-width: 90vw;">
        <q-form @submit.prevent="saveProduct">
          <q-card-section>
            <div class="text-h6">{{ isEditing ? 'Editar Produto' : 'Novo Produto' }}</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input v-model="newProduct.nome" label="Nome do Produto" outlined :rules="[val => !!val || 'Campo obrigatório']" />
            <q-select v-model="newProduct.categoria" :options="categoryOptions" label="Categoria" outlined @update:model-value="handleCategoryChange" />
            
            <q-input
              v-if="newProduct.categoria === 'Bolo'"
              v-model.number="newProduct.preco"
              label="Preço por KG"
              type="number"
              prefix="R$"
              outlined
              :rules="[val => val > 0 || 'O preço deve ser maior que zero']"
            />
            <q-input
              v-else
              v-model.number="newProduct.preco"
              label="Preço Unitário"
              type="number"
              prefix="R$"
              outlined
            />

            <q-input
              v-model.number="newProduct.precopromocional"
              label="Preço Promocional (opcional)"
              type="number"
              prefix="R$"
              outlined
              clearable
              hint="Deixe em branco ou 0 para não aplicar promoção."
            />

            <q-input
              :model-value="formattedTime"
              label="Tempo de Preparo"
              outlined
              readonly
              @click="openTimePicker"
              class="cursor-pointer"
            >
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time
                    v-model="timePickerModel"
                    format24h
                  >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cancelar" color="primary" flat />
                    <q-btn v-close-popup label="OK" color="primary" flat @click="setTime" />
                  </div>
                  </q-time>
                </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input v-model="newProduct.descricao" label="Descrição" type="textarea" outlined />

            <q-file
              v-model="imageFile"
              label="Imagem do Produto"
              outlined
              accept="image/*"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            
            <q-img
              v-if="newProduct.imagemurl && !imageFile"
              :src="`http://localhost:3000${newProduct.imagemurl}`"
              style="height: 150px; max-width: 150px"
            />

          </q-card-section>

          <q-card-section>
            <q-toggle v-model="newProduct.disponivel" label="Disponível para venda" />
            <q-toggle v-model="newProduct.destaque" label="Marcar como destaque no menu" color="accent" />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Salvar" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

const $q = useQuasar();
const products = ref([]);
const loading = ref(false);
const productDialogVisible = ref(false);
const isEditing = ref(false);

const defaultNewProduct = {
  nome: '',
  descricao: '',
  categoria: null,
  preco: 0,
  unidademedida: 'unidade',
  tempopreparo: 0,
  disponivel: true,
  destaque: false,
  precopromocional: null,
  imagemurl: '',
};
const newProduct = ref({ ...defaultNewProduct });
const imageFile = ref(null);

const categoryOptions = ['Bolo', 'Docinho', 'Personalizado'];
const timePickerModel = ref('00:00');

const columns = [
  { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
  { name: 'categoria', label: 'Categoria', field: 'categoria', align: 'left', sortable: true },
  { name: 'preco', label: 'Preço', field: 'preco', align: 'right', sortable: true },
  { name: 'tempopreparo', label: 'Preparo (min)', field: 'tempopreparo', align: 'center' },
  { name: 'disponivel', label: 'Disponível', field: 'disponivel', align: 'center' },
  { name: 'actions', label: 'Ações', align: 'center' },
];

const formattedTime = computed(() => {
  const totalMinutes = newProduct.value.tempopreparo;
  if (totalMinutes === 0) {
    return '';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours > 0 ? `${hours}h` : '', minutes > 0 ? `${minutes}min` : ''].join(' ').trim();
});

function openTimePicker() {
  const totalMinutes = newProduct.value.tempopreparo;
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  timePickerModel.value = `${hours}:${minutes}`;
}

function setTime() {
  const [hours, minutes] = timePickerModel.value.split(':').map(Number);
  newProduct.value.tempopreparo = (hours * 60) + minutes;
}

const formatCurrency = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function handleCategoryChange(value) {
  if (value === 'Bolo') {
    newProduct.value.unidademedida = 'kg';
  } else {
    newProduct.value.unidademedida = 'unidade';
  }
}

async function updateAvailability(product) {
  console.log('Atualizar disponibilidade:', product);
}

async function fetchProducts() {
  loading.value = true;
  try {
    const response = await axios.get('/api/admin/produtos');
    products.value = response.data;
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Falha ao carregar produtos.', error });
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  isEditing.value = false;
  newProduct.value = { ...defaultNewProduct };
  productDialogVisible.value = true;
}

function openEditDialog(product) {
  isEditing.value = true;
  newProduct.value = { ...product };
  imageFile.value = null;
  productDialogVisible.value = true;
}

async function saveProduct() {
  try {
    let imageUrl = newProduct.value.imagemurl;

    if (imageFile.value) {
      const formData = new FormData();
      formData.append('image', imageFile.value);
      
      const uploadResponse = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      imageUrl = uploadResponse.data.imageUrl;
    }

    const productPayload = {
      ...newProduct.value,
      imagemurl: imageUrl,
    };

    if (isEditing.value) {
      await axios.put(`/api/admin/produtos/${productPayload.idproduto}`, productPayload);
    } else {
      await axios.post('/api/admin/produtos', productPayload);
    }
    $q.notify({ color: 'positive', message: 'Produto salvo com sucesso!' });
    productDialogVisible.value = false;
    fetchProducts();
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Erro ao salvar o produto.', error });
  }
}

function confirmDelete(product) {
  $q.dialog({
    title: 'Confirmar Exclusão',
    message: `Você tem certeza que quer excluir o produto "${product.nome}"? Esta ação é irreversível. Para confirmar, digite o nome do produto abaixo:`,
    prompt: {
      model: '',
      label: product.nome,
      isValid: val => val === product.nome,
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(() => {
    deleteProduct(product.idproduto);
  });
}

async function deleteProduct(id) {
  try {
    await axios.delete(`/api/admin/produtos/${id}`);
    $q.notify({ color: 'positive', message: 'Produto excluído com sucesso!' });
    products.value = products.value.filter(p => p.idproduto !== id);
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Erro ao excluir o produto.';
    $q.notify({ color: 'negative', message: errorMessage });
  }
}

onMounted(fetchProducts);
</script>