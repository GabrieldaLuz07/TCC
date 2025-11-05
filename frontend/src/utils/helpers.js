import { date } from 'quasar';

export function getStatusColor(status) {
  switch (status) {
    case 'Pendente': return 'orange';
    case 'Aprovado': return 'teal';
    case 'Em Preparo': return 'blue';
    case 'Pronto para retirada': return 'indigo';
    case 'Saiu para entrega': return 'cyan';
    case 'Finalizado': return 'green';
    case 'Cancelado': return 'red';
    default: return 'grey';
  }
}

export function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(dataString) {
  if (!dataString) return 'Não especificada';
  return date.formatDate(dataString, 'DD/MM/YYYY');
}