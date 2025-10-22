import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [], 
  }),

  getters: {
    cartItemCount: (state) => {
      return state.items.length;
    },
    cartTotal: (state) => {
      return state.items.reduce((totalAcumulado, item) => {
      const precoASerUsado = item.precopromocional && item.precopromocional > 0
        ? item.precopromocional
        : item.preco;          
      const subtotalItem = precoASerUsado * item.quantity;
      return totalAcumulado + subtotalItem;
    }, 0);
    }
  },

  actions: {
    addToCart(product, quantityToAdd) {
      let existingItem;

      if (product.categoria === 'Bolo') {
        existingItem = this.items.find(item => item.idcarrinhocustom === product.idcarrinhocustom);
      } else {
        existingItem = this.items.find(item => item.idproduto === product.idproduto);
      }

      if (existingItem) {
        existingItem.quantity += quantityToAdd;
      } else {
        this.items.push({
          ...product,
          quantity: quantityToAdd
        });
      }
    },
    removeFromCart(productId) {
      let index;
      if (typeof productId === 'number') {
        index = this.items.findIndex(item => item.idproduto === productId);
      } else {
        index = this.items.findIndex(item => item.idcarrinhocustom === productId);
      }
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    },
    clearCart() {
      this.items = [];
    },
  }
});