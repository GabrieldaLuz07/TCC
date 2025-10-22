<template>
  <q-page>
    <div class="q-pa-md">
      <div class="q-pa-md">
        <div class="text-center q-mb-lg" style="margin-bottom: 0px;">
          <q-img
            v-if="settingsStore.logoUrl"
            :src="`http://localhost:3000${settingsStore.logoUrl}`"
            style="max-height: 130px; max-width: 250px; margin-bottom: 10px;"
            fit="contain"
          />
        </div>
        <div class="text-h3 text-weight-bold text-center q-mb-md">
          {{ settingsStore.shopName }}
        </div>
        <div class="text-subtitle1 text-grey-7 text-center q-mb-lg" style="margin-bottom: 0px;">
          Feito com carinho, especialmente para você!
        </div>
      </div>

      <div v-if="loading" class="text-center q-mt-xl">
        <q-spinner-dots color="primary" size="50px" />
        <p class="q-mt-md">Carregando delícias...</p>
      </div>

      <div v-else>
        <q-tabs
          v-model="activeCategory"
          inline-label
          class="bg-primary text-white shadow-2"
          align="justify"
        >
          <q-tab
            v-for="category in categories"
            :key="category"
            :name="category"
            :label="category"
          />
        </q-tabs>

        <q-tab-panels v-model="activeCategory" animated>
          <q-tab-panel
            v-for="category in categories"
            :key="category"
            :name="category"
            class="q-pa-lg"
          >
            <div class="text-h5 q-mb-md">{{ category }}</div>
            
            <div v-if="category === 'Bolo'" class="row justify-center">
              <q-card class="product-card card-clickable" @click="handleBoloClick">
                <q-img src="/public/images/bolo.png" :ratio="16/9" />
                <q-card-section>
                  <div class="text-h6">Bolo Personalizado</div>
                  <div class="text-caption text-grey q-mt-sm">
                    Clique aqui para montar o bolo dos seus sonhos, escolhendo tamanho, massa, recheios e cobertura.
                  </div>
                </q-card-section>
                <q-card-section class="q-pt-none">
                  <div class="text-subtitle1 text-weight-bold text-primary">
                    A partir de R$120.00
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div v-else class="q-gutter-md row items-start justify-center">
              <q-card
                v-for="product in menuData[category]"
                :key="product.idproduto"
                class="product-card"
                @click="handleItemClick(product)"
                :class="{ 'card-clickable': ['Docinho', 'Personalizado'].includes(product.categoria) }"
                :clickable="['Docinho', 'Personalizado'].includes(product.categoria)"
                v-ripple="['Docinho', 'Personalizado'].includes(product.categoria)"
              >
                <q-img
                  :src="`http://localhost:3000${product.imagemurl}`"
                  :ratio="16/9"
                  v-if="product.imagemurl"
                >
                  <template v-slot:loading><q-spinner-ios color="primary" /></template>
                  <template v-slot:error>
                    <div class="absolute-full flex flex-center bg-grey-4 text-white text-center">
                      <q-icon name="error_outline" size="md" />
                      <div class="q-mt-sm">Imagem não encontrada</div>
                    </div>
                  </template>
                </q-img>
                <q-img
                  src="https://placehold.co/300x200/d3d3d3/777?text=Sem+Foto"
                  :ratio="16/9"
                  v-else
                />
                
                <q-card-section>
                  <div class="text-h6">{{ product.nome }}</div>
                  <div class="text-caption text-grey q-mt-sm">{{ product.descricao }}</div>
                </q-card-section>
                
                <q-card-section class="q-pt-none">
                  <div v-if="product.precopromocional && product.precopromocional > 0">
                    <div class="text-caption text-grey text-strike">{{ formatCurrency(product.preco) }}</div>
                    <div class="text-subtitle1 text-weight-bold text-negative">
                      {{ formatCurrency(product.precopromocional) }} / {{ product.unidademedida }}
                    </div>
                  </div>
                  <div v-else>
                    <div class="text-subtitle1 text-weight-bold text-primary">
                      {{ formatCurrency(product.preco) }} / {{ product.unidademedida }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <q-dialog v-model="itemDialogVisible">
      <q-card style="width: 400px;">
        <q-form @submit.prevent="handleAddToCart_Item">
          <q-card-section>
            <div class="text-h6">Adicionar {{ selectedProduct?.nome }}</div>
          </q-card-section>
          <q-card-section class="q-pt-none text-center">
            <div class="text-h5 q-my-md">Selecione a quantidade</div>
            <div class="row items-center justify-center">
              <q-input
                v-model.number="itemQuantity"
                type="number"
                outlined dense
                :rules="[val => val > 0 || 'A quantidade deve ser maior que zero']"
                style="width: 200px; text-align: center;"
              >
                <template v-slot:prepend><q-btn round dense flat icon="remove" @click="itemQuantity > 1 ? itemQuantity-- : null" /></template>
                <template v-slot:append><q-btn round dense flat icon="add" @click="itemQuantity++" /></template>
              </q-input>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Adicionar ao Carrinho" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="cakeDialogVisible">
      <q-card style="width: 600px; max-width: 90vw;">
        <q-form @submit.prevent="handleAddToCart_Cake">
          <q-card-section>
            <div class="text-h6">Personalize seu Bolo</div>
          </q-card-section>

          <div v-if="cakeOptionsLoading" class="text-center q-pa-lg">
            <q-spinner-dots color="primary" size="40px" />
          </div>

          <q-card-section v-else class="q-gutter-md">
            <q-select
              outlined
              v-model="cakeConfiguration.tamanho"
              :options="tamanhosBolo"
              :option-label="(opt) => `${opt.nome} - ${opt.descricao} (R$${opt.valor})`"
              option-value="self"
              label="Tamanho"
              :rules="[val => !!val || 'Escolha um tamanho']"
            />
            
            <div>
              <q-select
                outlined
                v-model="cakeConfiguration.massa"
                :options="massasBolo"
                :option-label="(opt) => `${opt.nome} ${opt.valoradicional > 0 ? '(+ ' + formatCurrency(opt.valoradicional) + ')' : ''}`"
                option-value="self"
                label="Sabor da Massa"
                :rules="[val => !!val || 'Escolha uma massa']"
              />
              <div class="text-right text-primary q-pr-sm cursor-pointer text-caption" @click="showMassaInfo" style="margin-top: -10px;">Mais informações</div>
            </div>
            
            <div>
              <q-select
                outlined
                v-model="cakeConfiguration.cobertura"
                :options="coberturasBolo"
                :option-label="(opt) => `${opt.nome} ${opt.valoradicional > 0 ? '(+ ' + formatCurrency(opt.valoradicional) + ')' : ''}`"
                option-value="self"
                label="Cobertura"
                :rules="[val => !!val || 'Escolha uma cobertura']"
              />
              <div class="text-right text-primary q-pr-sm cursor-pointer text-caption" @click="showCoberturaInfo" style="margin-top: -10px;">Mais informações</div>
            </div>

            <div>
              <div class="text-subtitle1">Recheios</div>
              <div class="text-caption text-grey">Escolha até 3 opções.</div>
              <q-option-group
                v-model="cakeConfiguration.recheios"
                :options="recheiosBolo.map(opt => ({
                  label: `${opt.nome} ${opt.valoradicional > 0 ? '(+ ' + formatCurrency(opt.valoradicional) + ')' : ''}`,
                  value: opt,
                  disable: cakeConfiguration.recheios.length >= 3 && !cakeConfiguration.recheios.includes(opt)
                }))"
                type="checkbox"
                :rules="recheioRules"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Adicionar ao Carrinho" color="primary" :disable="!isCakeConfigValid" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useQuasar } from 'quasar';
import { useCartStore } from 'src/stores/cart-store';
import { useSettingsStore } from 'src/stores/settings-store';

const $q = useQuasar();
const cartStore = useCartStore();
const settingsStore = useSettingsStore();

const menuData = ref({});
const loading = ref(true);
const activeCategory = ref('Destaques');
const selectedProduct = ref(null);

const itemDialogVisible = ref(false);
const itemQuantity = ref(1);

const cakeDialogVisible = ref(false);
const cakeOptionsLoading = ref(false);
const cakeConfiguration = ref({
  tamanho: null,
  massa: null,
  recheios: [],
  cobertura: null,
});

const tamanhosBolo = ref([]);
const massasBolo = ref([]);
const coberturasBolo = ref([]);
const recheiosBolo = ref([]);

const categories = computed(() => {
  return Object.keys(menuData.value);
});

const formatCurrency = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function fetchMenu() {
  loading.value = true;
  try {
    const response = await axios.get('/api/produtos');
    menuData.value = response.data;
    
    if (!menuData.value.Bolo) {
      menuData.value.Bolo = [];
    }

    if (response.data.Destaques && response.data.Destaques.length > 0) {
      activeCategory.value = 'Destaques';
    } else {
      activeCategory.value = Object.keys(response.data)[0] || '';
    }
  } catch (error) {
    console.error('Erro ao buscar o menu:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchMenu();
});

function handleItemClick(product) {
  selectedProduct.value = product;
  itemQuantity.value = 1;
  itemDialogVisible.value = true;
}

function handleBoloClick() {
  cakeConfiguration.value = {
    tamanho: null,
    massa: null,
    recheios: [],
    cobertura: null,
  };
  fetchCakeOptions();
  cakeDialogVisible.value = true;
}

function handleAddToCart_Item() {
  if (!selectedProduct.value) return;

  const itemParaCarrinho = {
    ...selectedProduct.value,
    quantity: itemQuantity.value
  };

  cartStore.addToCart(itemParaCarrinho, itemQuantity.value);
  $q.notify({
    color: 'positive',
    message: `${itemQuantity.value}x "${itemParaCarrinho.nome}" adicionado(s) ao carrinho!`,
    icon: 'check_circle',
    position: 'top',
  });
  itemDialogVisible.value = false;
}

async function fetchCakeOptions() {
  cakeOptionsLoading.value = true;
  try {
    const [tamanhosRes, massasRes, coberturasRes, recheiosRes] = await Promise.all([
      axios.get('/api/tamanhosbolo'),
      axios.get('/api/massasbolo'),
      axios.get('/api/coberturasbolo'),
      axios.get('/api/recheiosbolo')
    ]);
    
    tamanhosBolo.value = tamanhosRes.data;
    massasBolo.value = massasRes.data;
    coberturasBolo.value = coberturasRes.data;
    recheiosBolo.value = recheiosRes.data;
    
  } catch (error) {
    console.error("Erro ao buscar opções de bolo:", error);
  } finally {
    cakeOptionsLoading.value = false;
  }
}

async function showMassaInfo() {
  const massaDescriptions = {};
  massasBolo.value.forEach(massa => {
    massaDescriptions[massa.nome] = massa.descricao || 'Sem descrição disponível.';
  });

  const messageHtml = Object.entries(massaDescriptions)
    .map(([massa, description]) => 
      `<div class="q-mb-md">
         <strong>${massa}:</strong>
         <div class="text-caption">${description}</div>
       </div>`
    )
    .join('');

  $q.dialog({
    title: 'Conheça Nossas Massas',
    message: messageHtml,
    html: true,
    ok: { push: true, label: 'Entendi', color: 'primary' }
  });
}

async function showCoberturaInfo() {
  const coberturaDescriptions = {};
  coberturasBolo.value.forEach(cobertura => {
    coberturaDescriptions[cobertura.nome] = cobertura.descricao || 'Sem descrição disponível.';
  });

  const messageHtml = Object.entries(coberturaDescriptions)
    .map(([cobertura, description]) => 
      `<div class="q-mb-md">
         <strong>${cobertura}:</strong>
         <div class="text-caption">${description}</div>
       </div>`
    )
    .join('');

  $q.dialog({
    title: 'Conheça Nossas Coberturas',
    message: messageHtml,
    html: true,
    ok: { push: true, label: 'Entendi', color: 'primary' }
  });
}

const isCakeConfigValid = computed(() => {
  const config = cakeConfiguration.value;
  return config.tamanho && 
         config.massa && 
         config.recheios.length > 0 &&
         config.recheios.length <= 3 &&
         config.cobertura;
});

const recheioRules = [
  val => val.length > 0 || 'Escolha pelo menos um recheio.',
  val => val.length <= 3 || 'Você pode escolher no máximo 3 recheios.'
];

function handleAddToCart_Cake() {
  if (!isCakeConfigValid.value) return;

  const { tamanho, massa, recheios, cobertura } = cakeConfiguration.value;

  const precoBase = parseFloat(tamanho.valor);

  let somaAdicionais = 0;
  somaAdicionais += parseFloat(massa.valoradicional);
  somaAdicionais += parseFloat(cobertura.valoradicional);
  recheios.forEach(recheio => {
    somaAdicionais += parseFloat(recheio.valoradicional);
  });

  const precoFinal = precoBase + somaAdicionais;

  if (isNaN(precoFinal)) {
    console.error("ERRO DE CÁLCULO (NaN):", { precoBase, somaAdicionais, tamanho, massa, cobertura });
    $q.notify({ color: 'negative', message: 'Erro ao calcular o preço. Verifique os valores das opções.' });
    return;
  }

  const nomeDescritivo = `Bolo Personalizado (${tamanho.nome})`;
  const descricaoPersonalizada = `Tamanho: ${tamanho.nome}, Massa: ${massa.nome}, Cobertura: ${cobertura.nome}, Recheios: ${recheios.map(r => r.nome).join(', ')}`;
  
  const cartId = `BOLO-${tamanho.idtamanho}-${massa.idmassa}-${recheios.map(r => r.idrecheio).join('-')}-${cobertura.idcobertura}`;

  const boloPersonalizado = {
    idproduto: null,
    idcarrinhocustom: cartId,
    nome: nomeDescritivo,
    descricao: descricaoPersonalizada,
    preco: precoFinal,
    unidademedida: 'unidade',
    categoria: 'Bolo'
  };
  
  cartStore.addToCart(boloPersonalizado, 1); 

  $q.notify({
    color: 'positive',
    message: `"${boloPersonalizado.nome}" adicionado ao carrinho!`,
    icon: 'check_circle',
    position: 'top',
  });

  cakeDialogVisible.value = false;
}
</script>

<style scoped>
.product-card {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: none;
  border: 1px solid #cacaca;
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
}
.product-card .q-card-section:last-child {
  margin-top: auto;
}
.card-clickable {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.card-clickable:hover {
  cursor: pointer;
  transform: translateY(-5px); 
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
</style>