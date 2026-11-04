// frontend/src/data/simulatedAudit.js
// ERSOFT v1.1 - Registro de Auditoría Inmutable (Strictly INSERT-only, RN-10)

const AUDIT_STORAGE_KEY = 'ersoft_auditoria_log';

/**
 * 12 eventos realistas iniciales de bitácora que cubren todos los módulos y tipos de acción permitidos.
 */
export const simulatedAudit = [
  {
    id: 1,
    fecha_hora: '2026-10-25T08:30:00.000Z',
    usuario: 'Alexander Lee (Master)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'INVENTARIO',
    tipo_accion: 'CREAR',
    descripcion_legible: 'Creación de lote de inventario inicial CAMPAÑA DE VERANO en Almacén Central',
    datos_previos_json: null,
    datos_nuevos_json: {
      lote_id: 1001,
      nombre: 'CAMPAÑA DE VERANO',
      almacen_id: 101,
      total_productos: 120,
      estado: 'Activo'
    },
    ip: '192.168.1.100'
  },
  {
    id: 2,
    fecha_hora: '2026-10-25T08:45:00.000Z',
    usuario: 'Alexander Lee (Master)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'KARDEX',
    tipo_accion: 'CREAR',
    descripcion_legible: 'Registro de Balance Inicial de inventario por S/ 18,838.00 (INVENTARIO_APERTURA / RN-01)',
    datos_previos_json: null,
    datos_nuevos_json: {
      tipo_balance: 'INVENTARIO_APERTURA',
      lote_referencia: 'CAMPAÑA DE VERANO',
      monto_costo_total: 18838.00,
      tipo_movimiento_kardex: 'INVENTARIO_INICIAL'
    },
    ip: '192.168.1.100'
  },
  {
    id: 3,
    fecha_hora: '2026-10-26T09:00:00.000Z',
    usuario: 'Alexander Lee (Master)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'EMPRESA',
    tipo_accion: 'EDITAR',
    descripcion_legible: 'Actualización de datos generales de la empresa y configuración de series SUNAT F001 / B001',
    datos_previos_json: {
      telefono: '975000000',
      serieFactura: 'F000',
      serieBoleta: 'B000'
    },
    datos_nuevos_json: {
      telefono: '975262030',
      serieFactura: 'F001',
      serieBoleta: 'B001',
      codigoEstablecimiento: '0000'
    },
    ip: '192.168.1.100'
  },
  {
    id: 4,
    fecha_hora: '2026-10-27T08:00:00.000Z',
    usuario: 'Carlos Lopez (Cajero)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'CAJA',
    tipo_accion: 'CREAR',
    descripcion_legible: 'Apertura de turno de Caja Turno Mañana con saldo base de S/ 500.00 (CAPITAL_CAJA)',
    datos_previos_json: null,
    datos_nuevos_json: {
      caja_id: 'CAJA-P01',
      turno: 'Mañana',
      monto_apertura: 500.00,
      usuario_cajero: 'Carlos Lopez'
    },
    ip: '192.168.1.105'
  },
  {
    id: 5,
    fecha_hora: '2026-10-27T10:15:30.000Z',
    usuario: 'Carlos Lopez (Cajero)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'VENTAS',
    tipo_accion: 'CREAR',
    descripcion_legible: 'Emisión de Boleta Electrónica B001-000124 a Juan Perez por S/ 150.00 en efectivo',
    datos_previos_json: null,
    datos_nuevos_json: {
      comprobante: 'B001-000124',
      tipo: 'Boleta',
      cliente: 'Juan Perez (DNI 10000001)',
      total: 150.00,
      subtotal_sin_igv: 127.12,
      igv: 22.88,
      metodo_pago: 'Efectivo'
    },
    ip: '192.168.1.105'
  },
  {
    id: 6,
    fecha_hora: '2026-10-27T11:40:00.000Z',
    usuario: 'Juan Perez (Administrador)',
    sucursal_id: '2',
    sucursal_nombre: 'Sede Norte',
    modulo: 'VENTAS',
    tipo_accion: 'ANULAR',
    descripcion_legible: 'Anulación de Nota de Venta NV01-0042 por error en selección de ítem y devolución a stock',
    datos_previos_json: {
      comprobante: 'NV01-0042',
      estado: 'Emitida',
      total: 85.00
    },
    datos_nuevos_json: {
      comprobante: 'NV01-0042',
      estado: 'Anulada',
      motivo: 'Devolución de cliente por ítem erróneo',
      kardex_reingreso: true
    },
    ip: '192.168.2.10'
  },
  {
    id: 7,
    fecha_hora: '2026-10-27T14:20:10.000Z',
    usuario: 'Juan Perez (Administrador)',
    sucursal_id: '2',
    sucursal_nombre: 'Sede Norte',
    modulo: 'TBF',
    tipo_accion: 'EDITAR',
    descripcion_legible: 'Reintento de transmisión y sincronización SUNAT para Boleta B001-000118 tras caída de red',
    datos_previos_json: {
      comprobante: 'B001-000118',
      estado_sunat: 'PENDIENTE_ENVIO',
      codigo_respuesta: null
    },
    datos_nuevos_json: {
      comprobante: 'B001-000118',
      estado_sunat: 'ACEPTADO',
      codigo_respuesta: '0',
      cdr_hash: '9a8b7c6d5e4f'
    },
    ip: '192.168.2.10'
  },
  {
    id: 8,
    fecha_hora: '2026-10-28T09:10:00.000Z',
    usuario: 'Juan Perez (Administrador)',
    sucursal_id: '2',
    sucursal_nombre: 'Sede Norte',
    modulo: 'RENDICIONES',
    tipo_accion: 'CREAR',
    descripcion_legible: 'Registro de solicitud de rendición por ALQUILER de local Sede Norte por S/ 2,400.00 con crédito fiscal',
    datos_previos_json: null,
    datos_nuevos_json: {
      rendicion_id: 'REND-2026-001',
      categoria: 'ALQUILER',
      monto_total: 2400.00,
      tiene_credito_fiscal_igv: true,
      subtotal_sin_igv: 2033.90,
      monto_igv: 366.10,
      comprobante_referencia: 'F001-0004589 (Inmobiliaria Norte SAC)',
      estado: 'PENDIENTE_APROBACION'
    },
    ip: '192.168.2.10'
  },
  {
    id: 9,
    fecha_hora: '2026-10-28T11:30:00.000Z',
    usuario: 'Alexander Lee (Master)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'RENDICIONES',
    tipo_accion: 'APROBAR',
    descripcion_legible: 'Aprobación de rendición de FLETE_TRANSPORTE por S/ 350.00 para traslado de mercadería intersucursal',
    datos_previos_json: {
      rendicion_id: 'REND-2026-002',
      estado: 'PENDIENTE_APROBACION'
    },
    datos_nuevos_json: {
      rendicion_id: 'REND-2026-002',
      estado: 'APROBADO',
      fecha_resolucion: '2026-10-28T11:30:00.000Z',
      usuario_aprobador: 'Alexander Lee'
    },
    ip: '192.168.1.100'
  },
  {
    id: 10,
    fecha_hora: '2026-10-28T15:00:00.000Z',
    usuario: 'Carlos Lopez (Cajero)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'CRM',
    tipo_accion: 'CREAR',
    descripcion_legible: 'Creación de oportunidad comercial "Equipamiento de Insumos Verano" para cliente Constructora B EIRL',
    datos_previos_json: null,
    datos_nuevos_json: {
      oportunidad_id: 'OPP-101',
      cliente_nombre: 'Constructora B EIRL',
      documento: '20600000002',
      etapa: 'PROSPECTO',
      monto_estimado: 4800.00
    },
    ip: '192.168.1.105'
  },
  {
    id: 11,
    fecha_hora: '2026-10-29T10:00:00.000Z',
    usuario: 'Carlos Lopez (Cajero)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'CRM',
    tipo_accion: 'EDITAR',
    descripcion_legible: 'Avance de etapa en oportunidad OPP-102 (Servicios C SA) de CONTACTADO a COTIZADO tras envío de propuesta',
    datos_previos_json: {
      oportunidad_id: 'OPP-102',
      etapa: 'CONTACTADO'
    },
    datos_nuevos_json: {
      oportunidad_id: 'OPP-102',
      etapa: 'COTIZADO',
      monto_estimado: 3200.00,
      total_items: 4
    },
    ip: '192.168.1.105'
  },
  {
    id: 12,
    fecha_hora: '2026-10-29T16:45:00.000Z',
    usuario: 'Alexander Lee (Master)',
    sucursal_id: '1',
    sucursal_nombre: 'Sede Principal',
    modulo: 'INVENTARIO',
    tipo_accion: 'TRANSPASAR',
    descripcion_legible: 'Traspaso interno de 25 unidades de mercadería desde Almacén Central (Sede 1) hacia Sede Norte (Sede 2)',
    datos_previos_json: {
      almacen_origen_id: 101,
      stock_origen_previo: 80
    },
    datos_nuevos_json: {
      almacen_origen_id: 101,
      almacen_destino_id: 102,
      cantidad_traspasada: 25,
      stock_origen_final: 55,
      documento_traslado: 'GUIA-REM-001'
    },
    ip: '192.168.1.100'
  }
];

/**
 * Obtener logs de auditoría persistidos en localStorage (con fallback a mockups iniciales)
 */
export const getAuditLogs = () => {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error cargando auditoría de localStorage:', e);
  }
  // Si no hay datos previos, inicializar con el mockup y guardarlo
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(simulatedAudit));
  } catch (err) {
    console.warn('No se pudo inicializar auditoria en localStorage:', err);
  }
  return simulatedAudit;
};

/**
 * Registrar un nuevo evento en auditoría (Strictly INSERT-only, RN-10).
 * Está estrictamente prohibido implementar funciones de edición o borrado físico sobre esta bitácora.
 */
export const logAuditAction = ({
  usuario = 'Sistema',
  sucursalId = '1',
  sucursalNombre = 'Sede Principal',
  modulo = 'SISTEMA',
  tipoAccion = 'CREAR',
  descripcion = '',
  datosPrevios = null,
  datosNuevos = {},
  ip = '127.0.0.1'
}) => {
  const currentLogs = getAuditLogs();
  const newLog = {
    id: Date.now(),
    fecha_hora: new Date().toISOString(),
    usuario,
    sucursal_id: String(sucursalId),
    sucursal_nombre: sucursalNombre,
    modulo: String(modulo).toUpperCase(),
    tipo_accion: String(tipoAccion).toUpperCase(),
    descripcion_legible: descripcion,
    datos_previos_json: datosPrevios ? JSON.parse(JSON.stringify(datosPrevios)) : null,
    datos_nuevos_json: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : {},
    ip
  };

  const updatedLogs = [newLog, ...currentLogs];
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Error guardando evento en auditoría:', e);
  }
  return newLog;
};

/**
 * Helpers de solo lectura para filtros de bitácora
 */
export const getAuditLogsByModulo = (modulo) => {
  const logs = getAuditLogs();
  if (!modulo || modulo === 'TODOS') return logs;
  return logs.filter(l => l.modulo === modulo.toUpperCase());
};

export const getAuditLogsBySucursal = (sucursalId) => {
  const logs = getAuditLogs();
  if (!sucursalId || sucursalId === 'TODOS') return logs;
  return logs.filter(l => String(l.sucursal_id) === String(sucursalId));
};
