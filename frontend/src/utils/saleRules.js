import { validateDocNumber } from './clientValidations';
import { todayLima } from './businessData';

export const validateSale = ({ saleType, client, total, condicion_pago, fecha_vencimiento }, mode) => {
  if (!(Number(total) > 0)) return 'El total debe ser mayor a cero.';
  if (mode === 'INTERNO_PRE_FORMALIZACION' && ['Factura', 'Boleta'].includes(saleType)) return 'El modo interno solo permite Nota de Venta NV01.';
  const identified = client?.nombre?.trim() && !/clientes? varios|consumidor final/i.test(client.nombre)
    && ['DNI', 'CE', 'RUC'].includes(client.docType) && !validateDocNumber(client.docType, client.documento || '');
  if (saleType === 'Factura' && (!identified || client.docType !== 'RUC')) return 'La FACTURA F001 exige un cliente con RUC válido de 11 dígitos.';
  if (saleType === 'Boleta' && Number(total) > 700 && !identified) return 'BOLETA mayor a S/ 700.00: no se permite Clientes Varios. Identifica al cliente con DNI, CE o RUC.';
  if (condicion_pago === 'CREDITO') {
    if (!identified) return 'Identifica al cliente para registrar la cuenta por cobrar.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento || '') || fecha_vencimiento < todayLima()) return 'Selecciona una fecha de vencimiento válida desde hoy.';
  }
  return '';
};
