import { useSettingsStore } from 'src/stores/settings-store';

export default async ({ store }) => {
  const settingsStore = useSettingsStore(store);
  await settingsStore.fetchSettings(); 
};