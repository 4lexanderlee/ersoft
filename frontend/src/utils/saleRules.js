import { validateDocNumber } from './clientValidations';
import { todayLima } from './businessData';

export const ADELANTO_PAYMENT_METHODS = ['Efectivo', 'Yape/Plin', 'Tarjeta', 'Transferencia'];

export const ADELANTO_METHOD_TO_KEY = {
  Efectivo: 'cash',
  'Yape/Plin': 'digital',
  Tarjeta: 'pos',
  Transferencia: 'bank',
};

export const TOP_DEMAND_LIMIT = 25;

export const allowsDecimals = (item) => Boolean(
  item?.permite_decimales
  || ['KGM', 'MTR', 'LTR', 'Kilogramo', 'Metro', 'Litro'].includes(item?.unidadMedida)
);

export const getUnitLabel = (item) => {
  const um = item?.unidadMedida;
  const map = {
    KGM: 'kg',
    Kilogramo: 'kg',
    MTR: 'm',
    Metro: 'm',
    LTR: 'L',
    Litro: 'L',
    NIU: 'und',
    Unidad: 'und',
  };
  return map[um] || um || 'und';
};

export const hasProductVariants = (item) => Boolean(
  item?._type !== 'Servicio'
  && String(item?.tipo || '').toUpperCase() !== 'SERVICIO'
  && (item?.tipoProducto === 'VARIANTES' || (Array.isArray(item?.variantes) && item.variantes.length > 0))
  && Array.isArray(item?.variantes)
  && item.variantes.length > 0
);

export const normalizeQty = (qty, isDecimal = false) => {
  const num = Number(qty);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return isDecimal ? Math.round(num * 1000) / 1000 : Math.trunc(num);
};

export const calcExactSubtotal = (qty, unitPrice) => {
  const q = Number(qty) || 0;
  const p = Number(unitPrice) || 0;
  return Number((q * p).toFixed(2));
};

export const isClientIdentified = (client) => {
  const nombre = (client?.nombre || client?.name || '').trim();
  const documento = client?.documento || client?.docNumber || '';
  return Boolean(
    nombre
    && !/clientes? varios|consumidor final/i.test(nombre)
    && ['DNI', 'CE', 'RUC'].includes(client?.docType)
    && !validateDocNumber(client.docType, documento)
  );
};

export const calculateCreditSummary = (total, rawAdelanto) => {
  const totalComprobante = Math.max(0, Number((Number(total) || 0).toFixed(2)));
  const hasRaw = rawAdelanto !== undefined && rawAdelanto !== null && String(rawAdelanto).trim() !== '';
  const parsed = hasRaw ? Number(rawAdelanto) : 0;
  const validAdelanto = Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 0;
  const adelantoPagadoHoy = validAdelanto < totalComprobante ? validAdelanto : (validAdelanto > 0 ? validAdelanto : 0);
  const effectiveAdelanto = Math.min(validAdelanto, totalComprobante);
  const saldoPendienteCredito = Math.max(0, Number((totalComprobante - effectiveAdelanto).toFixed(2)));
  const estadoCuenta = effectiveAdelanto > 0 ? 'PARCIAL' : 'PENDIENTE';

  return {
    totalComprobante,
    adelantoPagadoHoy: effectiveAdelanto,
    rawAdelanto: adelantoPagadoHoy,
    isAdelantoInvalid: hasRaw && (!Number.isFinite(parsed) || parsed < 0 || (totalComprobante > 0 && parsed >= totalComprobante)),
    saldoPendienteCredito,
    estadoCuenta,
  };
};

export const resolvePosAccessState = ({
  cajaSesiones = [],
  activeBranchCajaSesion = null,
  canOperatePOS = false,
  isTerminalBlocked = false,
  terminalInfo = null,
  sucursalId = '1',
}) => {
  const isOpen = (s) => ['ABIERTO', 'ABIERTA'].includes(String(s?.estado || '').trim().toUpperCase());
  const targetBranch = String(sucursalId || '1');

  const branchSession = Array.isArray(cajaSesiones) && cajaSesiones.length > 0
    ? cajaSesiones.find((s) => isOpen(s) && String(s.sucursalId ?? s.sucursal_id ?? '1') === targetBranch)
    : (isOpen(activeBranchCajaSesion)
      && String(activeBranchCajaSesion.sucursalId ?? activeBranchCajaSesion.sucursal_id ?? targetBranch) === targetBranch
      ? activeBranchCajaSesion
      : null);

  if (!branchSession) {
    return {
      locked: true,
      reasonType: 'CLOSED',
      reasonTitle: 'Turno de Caja Cerrado',
      branchSession: null,
      remoteIp: null,
      remoteTerminalId: null,
    };
  }

  const mismatchByTerminal = Boolean(
    (branchSession.terminal_id && terminalInfo?.terminal_id && branchSession.terminal_id !== terminalInfo.terminal_id)
  );
  const sameAsContextSession = !activeBranchCajaSesion || !branchSession.id || branchSession.id === activeBranchCajaSesion.id;
  const contextBlocked = sameAsContextSession && (!canOperatePOS || isTerminalBlocked);

  if (contextBlocked || mismatchByTerminal) {
    const remoteIp = branchSession.ip_detectada || activeBranchCajaSesion?.ip_detectada || 'No disponible';
    return {
      locked: true,
      reasonType: 'OTHER_DEVICE',
      reasonTitle: `Caja bloqueada: activa en otra terminal IP: ${remoteIp}`,
      branchSession,
      remoteIp,
      remoteTerminalId: branchSession.terminal_id || activeBranchCajaSesion?.terminal_id || 'TERM-REMOTA',
    };
  }

  return {
    locked: false,
    reasonType: null,
    reasonTitle: '',
    branchSession,
    remoteIp: null,
    remoteTerminalId: null,
  };
};

export const validateQuoteForCRM = ({ client, cart }) => {
  if (!Array.isArray(cart) || cart.length === 0 || !cart.some((c) => Number(c?.qty) > 0)) {
    return 'Agrega productos o servicios al carrito antes de guardar la cotización en el CRM.';
  }
  if (!isClientIdentified(client)) {
    return 'Selecciona o registra un cliente válido (DNI, CE o RUC) antes de guardar la cotización en el CRM.';
  }
  return '';
};

export const validateSale = ({
  saleType,
  client,
  total,
  condicion_pago,
  fecha_vencimiento,
  monto_adelanto,
  metodo_pago_adelanto,
  adelanto_monto,
  adelanto_metodo,
}, mode) => {
  if (!(Number(total) > 0)) return 'El total debe ser mayor a cero.';
  if (mode === 'INTERNO_PRE_FORMALIZACION' && ['Factura', 'Boleta'].includes(saleType)) {
    return 'El modo interno solo permite Nota de Venta NV01.';
  }
  const identified = isClientIdentified(client);
  if (saleType === 'Factura' && (!identified || client.docType !== 'RUC')) {
    return 'La FACTURA F001 exige un cliente con RUC válido de 11 dígitos.';
  }
  if (saleType === 'Boleta' && Number(total) > 700 && !identified) {
    return 'BOLETA mayor a S/ 700.00: no se permite Clientes Varios. Identifica al cliente con DNI, CE o RUC.';
  }
  if (condicion_pago === 'CREDITO') {
    if (!identified) return 'Identifica al cliente para registrar la cuenta por cobrar.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento || '') || fecha_vencimiento < todayLima()) {
      return 'Selecciona una fecha de vencimiento válida desde hoy.';
    }
    const rawAdelanto = monto_adelanto !== undefined ? monto_adelanto : adelanto_monto;
    const rawMetodo = metodo_pago_adelanto || adelanto_metodo;
    const hasAdelanto = rawAdelanto !== undefined && rawAdelanto !== null && String(rawAdelanto).trim() !== '';
    if (hasAdelanto) {
      const adv = Number(rawAdelanto);
      if (!Number.isFinite(adv) || adv < 0) {
        return 'El monto de adelanto no puede ser negativo.';
      }
      if (adv >= Number(total)) {
        return 'El monto de adelanto debe ser menor al total de la venta.';
      }
      if (adv > 0 && !ADELANTO_PAYMENT_METHODS.includes(rawMetodo)) {
        return 'Selecciona un método de pago válido para el adelanto.';
      }
    }
  }
  return '';
};
