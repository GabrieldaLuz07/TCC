import { defineStore } from 'pinia';
import axios from 'axios';
import { setCssVar } from 'quasar';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    shopName: 'Minha Confeitaria',
    logoUrl: null,
    primaryColor: '#e378fdff',
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSettings() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('/api/configuracoes');
        const settings = response.data;
        
        this.shopName = settings.nomeloja;
        this.logoUrl = settings.logourl;
        this.primaryColor = settings.corprincipal;

        setCssVar('primary', this.primaryColor);

      } catch (err) {
        this.error = 'Falha ao carregar as configurações da loja.';
        console.error(this.error, err);
        setCssVar('primary', '#e378fdff');
      } finally {
        this.loading = false;
      }
    },
  },
});