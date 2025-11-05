<template>
  <q-layout view="lHh Lpr lFf">

    <q-header elevated :style="{ backgroundColor: settingsStore.primaryColor }">
      <q-toolbar>
        <q-toolbar-title>
          Nosso Menu
        </q-toolbar-title>

        <q-btn flat round dense icon="receipt_long" @click="openTrackingDialog" class="q-mr-sm">
          <q-tooltip>Acompanhar Pedido</q-tooltip>
        </q-btn>

        <q-btn flat round dense icon="shopping_cart" @click="cartDialogVisible = true">
          <q-badge v-if="cartStore.cartItemCount > 0" color="red" floating>
            {{ cartStore.cartItemCount }}
          </q-badge>
        </q-btn>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="cartDialogVisible">
      <q-card style="width: 555px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Meu Carrinho</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="cartStore.items.length === 0" class="text-center">
          <q-icon name="remove_shopping_cart" size="64px" color="grey-5" class="q-mb-md" />
          <div class="text-subtitle1">Seu carrinho está vazio.</div>
        </q-card-section>

        <q-card-section v-else>
          <q-list bordered separator>
            <q-item v-for="item in cartStore.items" :key="item.idproduto || item.id_carrinho_custom" class="q-py-md">

              <q-item-section>
                <q-item-label>{{ item.nome }}</q-item-label>
                
                <q-item-label v-if="item.categoria === 'Bolo'" caption lines="2">
                  {{ item.descricao }}
                </q-item-label>
                
                <q-item-label v-else caption>
                  <div v-if="item.precopromocional && item.precopromocional > 0">
                    <div class="text-caption text-grey text-strike">
                      {{ formatCurrency(item.preco) }}
                    </div>
                    <div>
                      {{ formatCurrency(item.precopromocional) }} / un
                    </div>
                  </div>
                  <div v-else>
                    {{ formatCurrency(item.preco) }} / un
                  </div>
                </q-item-label>
                </q-item-section>

              <q-item-section side>
                <div v-if="item.categoria === 'Bolo'" class="text-body1 text-weight-medium q-mx-sm">
                  x{{ item.quantity }}
                </div>
                
                <div v-else class="row items-center no-wrap">
                  <q-btn round dense flat icon="remove" @click="cartStore.decreaseQuantity(item.idproduto)" />
                  <div class="text-body1 text-weight-medium q-mx-sm" style="min-width: 20px; text-align: center;">
                    {{ item.quantity }}
                  </div>
                  <q-btn round dense flat icon="add" @click="cartStore.increaseQuantity(item.idproduto)" />
                </div>
              </q-item-section>

              <q-item-section side class="text-right">
                <q-item-label class="text-weight-bold">
                  {{ formatCurrency(item.quantity * (item.precopromocional && item.precopromocional > 0 ? item.precopromocional : item.preco)) }}
                </q-item-label>
                <q-btn flat dense round icon="delete" color="negative" size="sm" class="q-mt-xs" @click="cartStore.removeFromCart(item.idproduto || item.id_carrinho_custom)" />
              </q-item-section>

            </q-item>
          </q-list>

          <div class="row justify-end q-mt-md text-h6">
            <span class="text-grey-8 q-mr-md">Total:</span>
            <span class="text-weight-bold">{{ formatCurrency(cartStore.cartTotal) }}</span>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" v-if="cartStore.items.length > 0">
          <q-btn flat label="Limpar Carrinho" color="negative" @click="cartStore.clearCart" />
          <q-btn label="Finalizar Compra" color="primary" @click="goToCheckout" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="trackingDialogVisible">
      <q-card style="width: 400px;">
        <q-form @submit.prevent="submitTracking">
          <q-card-section>
            <div class="text-h6">Acompanhar Pedido</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input
              v-model="trackingEmail"
              type="email"
              label="E-mail cadastrado no pedido"
              outlined
              dense
              :rules="[val => !!val || 'O e-mail é obrigatório']"
            />
            <q-input
              v-model="trackingKey"
              label="Chave de Acompanhamento"
              outlined
              dense
              :rules="[val => !!val || 'A chave é obrigatória']"
            />
          </q-card-section>
          
          <q-card-section v-if="trackingError" class="text-center text-negative">
            {{ trackingError }}
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn
              label="Buscar Pedido"
              color="primary"
              type="submit"
              :loading="trackingLoading"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="checkoutDialogVisible" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Finalizar Pedido</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="checkoutDialogVisible = false" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Seus Dados</div>
          <q-form class="q-gutter-md">
            <q-input
              v-model="customerInfo.nome"
              label="Seu nome completo *"
              outlined
              dense
              :rules="[val => !!val || 'O nome é obrigatório']"
              lazy-rules
            />
            <q-input
              v-model="customerInfo.telefone"
              label="Seu Telefone (WhatsApp) *"
              mask="(##) #####-####"
              outlined
              dense
              :rules="[val => (val && val.length > 0) || 'O telefone é obrigatório']"
              lazy-rules
            />
            <q-input
              v-model="customerInfo.email"
              label="Seu E-mail *"
              type="email"
              outlined
              dense
              :rules="[val => !!val || 'O e-mail é obrigatório']"
              lazy-rules
            />
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle1 q-mb-md">Como você gostaria de coletar seu pedido?</div>
          <q-option-group
            v-model="deliveryOption"
            :options="[
              { label: 'Retirar no local', value: 'retirada' },
              { label: 'Entrega (Delivery)', value: 'entrega' }
            ]"
            color="primary"
            inline
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Data de Entrega / Retirada</div>
          <q-input outlined dense v-model="dataEntrega" mask="##/##/####" :rules="[val => !!val || 'Escolha uma data']" label="Escolha a data *">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="dataEntrega"
                    :options="dateOptionsFn"
                    mask="DD/MM/YYYY"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Fechar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-separator />

        <q-card-section v-if="deliveryOption === 'retirada'">
          <div class="text-h6 q-mb-sm">Retirada</div>
          <div class="row items-center text-grey-8">
            <q-icon name="store" class="q-mr-sm" />
            <span>Rua Paraná, 123 - Centro, Pinhalzinho/SC</span>
          </div>
        </q-card-section>

        <q-card-section v-else>
          <div class="text-h6 q-mb-sm">Endereço de Entrega</div>
          <q-form class="q-gutter-md">
            <q-input v-model="deliveryAddress.rua" label="Rua / Avenida" outlined dense />
            <q-input v-model="deliveryAddress.numero" label="Número" outlined dense />
            <q-input v-model="deliveryAddress.bairro" label="Bairro" outlined dense />
            <q-input v-model="deliveryAddress.cidade" label="Cidade" outlined dense />
            <q-input v-model="deliveryAddress.complemento" label="Complemento (opcional)" outlined dense />
          </q-form>
        </q-card-section>

        <q-card-section class="bg-grey-2">
          <div class="text-h6 q-mb-md">
            Valor Total: {{ formatCurrency(finalTotal) }}
          </div>
          <div v-if="deliveryOption === 'entrega'" class="text-caption text-grey-7 q-mt-xs">
            (inclui R$ 9,00 de taxa de entrega)
          </div>
          
          <div class="text-center q-mb-md">
            <div class="text-h5 text-weight-bold">Forma de Pagamento</div>
          </div>
          
          <q-option-group
            v-model="paymentMethod"
            :options="availablePaymentOptions"
            color="primary"
            inline
            class="q-mb-md"
            @update:model-value="onPaymentMethodChange" />

          <div v-if="paymentMethod === 'pix'" class="text-center">
            <div class="text-subtitle1">Pagamento via PIX</div>

            <div v-if="pixLoading" class="q-my-md">
              <q-spinner-dots color="primary" size="40px" />
              <p>A gerar QR Code...</p>
            </div>

            <q-img v-if="pixQrCode" :src="pixQrCode" style="width: 200px; height: 200px; margin-top: 10px;" />

            <div v-if="pixQrCode" class="text-caption q-mt-sm">
              Aponte a câmara do seu celular para o QR Code para pagar o valor de
              <strong>{{ formatCurrency(finalTotal) }}</strong>
            </div>
          </div>

          <div v-if="paymentMethod === 'dinheiro'">
            <div class="text-subtitle1">Pagamento em Dinheiro</div>
            <q-input
              v-model.number="cashChangeFor"
              label="Precisa de troco para quanto?"
              type="number"
              prefix="R$"
              outlined
              dense
              clearable
              class="q-mt-sm"
              hint="Deixe em branco se não precisar de troco."
            />
          </div>

          <div v-if="paymentMethod === 'cartao'">
            <div class="text-subtitle1">Pagamento com Cartão</div>
            <div class="row items-center text-grey-8 q-mt-sm">
              <q-icon name="credit_card" class="q-mr-sm" size="sm" />
              <span>O pagamento será realizado na maquininha no momento da retirada.</span>
            </div>
          </div>

        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Voltar" @click="checkoutDialogVisible = false" />
          <q-btn label="Confirmar Pedido" color="primary" @click="submitOrder" :disable="!isCheckoutFormValid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useCartStore } from 'src/stores/cart-store';
import { useSettingsStore } from 'src/stores/settings-store';
import axios from 'axios';
import CustomerTrackingDialog from 'src/components/CustomerTrackingDialog.vue';

const $q = useQuasar();
const cartStore = useCartStore();
const settingsStore = useSettingsStore();

const cartDialogVisible = ref(false);
const checkoutDialogVisible = ref(false);

const customerInfo = ref({
  nome: '',
  telefone: '',
  email: ''
});

const dataEntrega = ref(null);
const dailyLoad = ref({});

const deliveryOption = ref('retirada');
const deliveryAddress = ref({
  rua: '',
  numero: '',
  bairro: '',
  cidade: 'Pinhalzinho',
  complemento: ''
});

const paymentMethod = ref(null);
const cashChangeFor = ref(null);
const pixQrCode = ref(null);
const pixLoading = ref(false);

const trackingDialogVisible = ref(false);
const trackingEmail = ref('');
const trackingKey = ref('');
const trackingLoading = ref(false);
const trackingError = ref(null);

const finalTotal = computed(() => {
  const deliveryFee = 10;
  if (deliveryOption.value === 'entrega') {
    return cartStore.cartTotal + deliveryFee;
  }
  return cartStore.cartTotal;
});

const availablePaymentOptions = computed(() => {
  if (deliveryOption.value === 'retirada') {
    return [
      { label: 'PIX', value: 'pix' },
      { label: 'Dinheiro', value: 'dinheiro' },
      { label: 'Cartão (na retirada)', value: 'cartao' }
    ];
  } else {
    return [
      { label: 'PIX', value: 'pix' },
      { label: 'Dinheiro', value: 'dinheiro' }
    ];
  }
});

watch(deliveryOption, () => {
  if (paymentMethod.value && !availablePaymentOptions.value.some(option => option.value === paymentMethod.value)) {
    paymentMethod.value = null;
  }
});

const isCheckoutFormValid = computed(() => {
  return customerInfo.value.nome &&
         customerInfo.value.telefone &&
         customerInfo.value.email &&
         paymentMethod.value &&
         dataEntrega.value;
});

async function fetchAvailability() {
  try {
    const response = await axios.get('/api/availability');
    dailyLoad.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar datas disponíveis:', error);
  }
}

function dateOptionsFn(d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentDate = new Date(d);
  const dayOfWeek = currentDate.getDay();

  if (currentDate < tomorrow) return false;
  if (dayOfWeek === 6 || dayOfWeek === 0) return false;

  const capacidadeDiariaMinutos = 600;
  const minutosDoCarrinhoAtual = cartStore.cartTotalMinutes;
  const dataFormatada = d.replace(/\//g, '-');
  const cargaAtualDoDia = dailyLoad.value[dataFormatada] || 0;

  if ((cargaAtualDoDia + minutosDoCarrinhoAtual) > capacidadeDiariaMinutos) {
    return false;
  }

  return true;
}

function goToCheckout() {
  cartDialogVisible.value = false;
  
  customerInfo.value = { nome: '', telefone: '', email: '' };
  paymentMethod.value = null;
  cashChangeFor.value = null;
  dataEntrega.value = null;
  pixQrCode.value = null;
  
  fetchAvailability();
  checkoutDialogVisible.value = true;
}

async function onPaymentMethodChange(value) {
  if (value === 'pix') {
    pixLoading.value = true;
    pixQrCode.value = null;
    try {
      const response = await axios.post('/api/pix', { valor: finalTotal.value });
      pixQrCode.value = response.data.qrCodeDataUrl;
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      $q.notify({ color: 'negative', message: 'Não foi possível gerar o QR Code do PIX.' });
    } finally {
      pixLoading.value = false;
    }
  }
}

async function submitOrder() {
  const orderDetails = {
    items: cartStore.items,
    total: finalTotal.value,
    customer: customerInfo.value,
    deliveryMethod: deliveryOption.value,
    address: deliveryOption.value === 'entrega' ? deliveryAddress.value : null,
    paymentInfo: {
      method: paymentMethod.value,
      changeFor: paymentMethod.value === 'dinheiro' ? cashChangeFor.value : null,
    },
    dataEntrega: dataEntrega.value,
  };

  try {
    await axios.post('/api/pedidos', orderDetails);

    $q.dialog({
      title: 'Pedido Enviado!',
      message: 'O seu pedido foi recebido com sucesso. Um e-mail de confirmação foi enviado com a sua chave de acompanhamento.',
      persistent: true
    }).onOk(() => {
      cartStore.clearCart();
      checkoutDialogVisible.value = false;
    });

  } catch (error) {
    console.error('Falha ao enviar o pedido:', error);
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error.response?.data?.message || 'Não foi possível enviar o seu pedido.',
      icon: 'report_problem'
    });
  }
}

function openTrackingDialog() {
  trackingEmail.value = '';
  trackingKey.value = '';
  trackingError.value = null;
  trackingLoading.value = false;
  trackingDialogVisible.value = true;
}

async function submitTracking() {
  trackingLoading.value = true;
  trackingError.value = null;
  try {
    const response = await axios.post('/api/acompanhar', {
      email: trackingEmail.value,
      chave: trackingKey.value,
    });
    
    trackingDialogVisible.value = false;
    
    $q.dialog({
      component: CustomerTrackingDialog,
      componentProps: {
        pedido: response.data
      }
    });

  } catch (error) {
    console.error('Erro ao acompanhar pedido:', error);
    if (error.response && error.response.status === 404) {
      trackingError.value = 'E-mail ou chave inválidos. Verifique os dados.';
    } else {
      trackingError.value = 'Não foi possível buscar o pedido. Tente mais tarde.';
    }
  } finally {
    trackingLoading.value = false;
  }
}

const formatCurrency = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
</script>