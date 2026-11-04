// Helpers compartidos del módulo Rendiciones / CxC / CxP / Balance Inicial

export const MODULO_RBAC = 'rendiciones_cxc_cxp';

const DEFAULT_SUCURSALES = [
  { id: '1', nombre: 'Sede Principal' },
  { id: '2', nombre: 'Sede Norte' },
  { id: '3', nombre: 'Sede Sur' },
];

/** Lee las sucursales configuradas en Empresa (localStorage) con fallback a las de ejemplo. */
export const loadSucursales = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('ersoft_sucursales'));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch (err) {
    console.warn('No se pudo leer ersoft_sucursales:', err);
  }
  return DEFAULT_SUCURSALES;
};

export const formatPEN = (n) =>
  `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Estado efectivo: una cuenta no pagada con fecha vencida se muestra como VENCIDO. */
export const estadoEfectivo = (cuenta) => {
  if (cuenta.estado === 'PAGADO' || (cuenta.saldo_pendiente ?? 0) <= 0) return 'PAGADO';
  if (cuenta.fecha_vencimiento && cuenta.fecha_vencimiento < todayISO()) return 'VENCIDO';
  return cuenta.estado;
};

export const ESTADO_CUENTA_COLOR = {
  PENDIENTE: 'amber',
  PARCIAL: 'blue',
  PAGADO: 'green',
  VENCIDO: 'red',
};

export const ESTADO_RENDICION_COLOR = {
  PENDIENTE_APROBACION: 'amber',
  APROBADO: 'green',
  RECHAZADO: 'red',
};

export const CATEGORIAS_GASTO = [
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'LUZ_AGUA', label: 'Luz / Agua' },
  { value: 'FLETE_TRANSPORTE', label: 'Flete / Transporte' },
  { value: 'INSUMOS_TIENDA', label: 'Insumos de tienda' },
  { value: 'OTROS', label: 'Otros' },
];

export const labelCategoria = (value) =>
  CATEGORIAS_GASTO.find((c) => c.value === value)?.label || value;

/** RN-02: subtotal_sin_igv = total / 1.18 ; igv = total - subtotal_sin_igv */
export const desglosarIGV = (total) => {
  const monto = Number(total) || 0;
  const subtotal = Number((monto / 1.18).toFixed(2));
  return { subtotal, igv: Number((monto - subtotal).toFixed(2)) };
};

export const sucursalNombre = (sucursales, id) =>
  sucursales.find((s) => String(s.id) === String(id))?.nombre || `Sucursal ${id}`;

/** Select nativo con el mismo estilo que Input (useDS.inputDarkFilled). */
export const selectCls = (ds) =>
  `w-full border rounded-xl outline-none transition-colors px-4 py-2.5 text-sm ${ds.inputDarkFilled}`;
