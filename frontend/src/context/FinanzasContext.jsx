/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { logAuditAction } from '../data/simulatedAudit';
import { useAuth } from './AuthContext';
import { usePermission } from '../hooks/usePermission';
import { isOpenCashSession, findCashSession, canUseCashSession } from '../utils/cashSession';
import { todayLima } from '../utils/businessData';

const FinanzasContext = createContext();

export const useFinanzas = () => {
  const context = useContext(FinanzasContext);
  if (!context) {
    throw new Error('useFinanzas debe ser utilizado dentro de un FinanzasProvider');
  }
  return context;
};

// ── Helpers de persistencia idénticos a InventarioContext ──────────────────────
const load = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error guardando en ${key}:`, e);
  }
};

// ── Seguridad de Terminal y Detección de Dispositivo / IP (R7) ─────────────────
const FINGERPRINT_STORAGE_KEY = 'ersoft_terminal_fingerprint';
const SIMULATION_STORAGE_KEY = 'ersoft_terminal_simular_otro';

export const getTerminalFingerprint = () => {
  try {
    const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.terminal_id) return { ...parsed, ip_detectada: null };
    }
  } catch (e) {
    console.error('Error cargando terminal fingerprint:', e);
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Linux';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const navegador_so = `${browser} / ${os}`;
  // La dirección se obtiene del servidor; nunca se inventa una IP.
  const ip_detectada = null;
  const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const terminal_id = `TERM-${randPart}`;

  const fp = {
    terminal_id,
    ip_detectada,
    navegador_so,
    fecha_creacion: new Date().toISOString()
  };
  try {
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, JSON.stringify(fp));
  } catch (e) {
    console.error('Error guardando terminal fingerprint:', e);
  }
  return fp;
};

const SIMULATED_REMOTE_DEVICE = {
  terminal_id: 'TERM-REMOTE-99',
  ip_detectada: '192.168.1.99',
  navegador_so: 'Safari / macOS (Terminal Remoto Simulado)',
  es_simulado: true
};

// ── Datos Iniciales Simulados: Balances Iniciales (RN-01) ──────────────────────
// Balance Inicial / Patrimonio NUNCA se registra como venta operativa.
const DEFAULT_BALANCES_INICIALES = [
  {
    id: 1,
    tipo: 'INVENTARIO_APERTURA', // 'CAPITAL_CAJA' | 'CAPITAL_BANCO' | 'INVENTARIO_APERTURA'
    concepto: 'Inventario Inicial de Apertura - Lote CAMPAÑA DE VERANO',
    monto: 18838.00,
    moneda: 'PEN',
    fecha: '2026-10-25',
    sucursal_id: '1',
    referencia: 'Lote CAMPAÑA DE VERANO (120 ítems)',
    usuario_registro: 'Alexander Lee (Master)'
  },
  {
    id: 2,
    tipo: 'CAPITAL_CAJA',
    concepto: 'Fondo Fijo Inicial para Apertura de Caja Chica',
    monto: 1500.00,
    moneda: 'PEN',
    fecha: '2026-10-25',
    sucursal_id: '1',
    referencia: 'Apertura Operativa Sede Principal',
    usuario_registro: 'Alexander Lee (Master)'
  },
  {
    id: 3,
    tipo: 'CAPITAL_BANCO',
    concepto: 'Aporte de Capital Social - Cuenta Corriente BCP',
    monto: 25000.00,
    moneda: 'PEN',
    fecha: '2026-10-25',
    sucursal_id: '1',
    referencia: 'Cta Cte BCP 194-1234567890-1-23',
    usuario_registro: 'Alexander Lee (Master)'
  },
  {
    id: 4,
    tipo: 'CAPITAL_CAJA',
    concepto: 'Fondo Inicial de Caja Chica Sede Norte',
    monto: 800.00,
    moneda: 'PEN',
    fecha: '2026-10-26',
    sucursal_id: '2',
    referencia: 'Apertura Operativa Sede Norte',
    usuario_registro: 'Juan Perez (Administrador)'
  }
];

// ── Datos Iniciales Simulados: Cuentas por Cobrar y Pagar (RN-03, RN-04) ──────
const DEFAULT_CUENTAS_COBRAR_PAGAR = [
  {
    id: 1,
    tipo: 'POR_COBRAR', // 'POR_COBRAR' | 'POR_PAGAR'
    cliente_proveedor_nombre: 'Juan Perez',
    tipo_documento: 'DNI',
    documento_identidad: '10000001',
    comprobante_referencia: 'B001-000120',
    concepto: 'Crédito a 15 días por compra de prendas verano',
    monto_total: 450.00,
    monto_pagado: 150.00,
    saldo_pendiente: 300.00,
    fecha_emision: '2026-10-20',
    fecha_vencimiento: '2026-11-04',
    sucursal_id: '1',
    estado: 'PARCIAL', // 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO'
    abonos: [
      {
        id: 101,
        fecha: '2026-10-27',
        monto: 150.00,
        metodo_pago: 'Efectivo',
        referencia: 'Recibo Caja A-01',
        usuario: 'Carlos Lopez (Cajero)'
      }
    ]
  },
  {
    id: 2,
    tipo: 'POR_COBRAR',
    cliente_proveedor_nombre: 'Constructora B EIRL',
    tipo_documento: 'RUC',
    documento_identidad: '20600000002',
    comprobante_referencia: 'F001-000045',
    concepto: 'Venta corporativa de uniformes y calzado de seguridad',
    monto_total: 2800.00,
    monto_pagado: 0.00,
    saldo_pendiente: 2800.00,
    fecha_emision: '2026-10-22',
    fecha_vencimiento: '2026-11-21',
    sucursal_id: '1',
    estado: 'PENDIENTE',
    abonos: []
  },
  {
    id: 3,
    tipo: 'POR_COBRAR',
    cliente_proveedor_nombre: 'Empresa A SAC',
    tipo_documento: 'RUC',
    documento_identidad: '20600000001',
    comprobante_referencia: 'F001-000030',
    concepto: 'Servicio técnico especializado y consumibles',
    monto_total: 1200.00,
    monto_pagado: 1200.00,
    saldo_pendiente: 0.00,
    fecha_emision: '2026-10-10',
    fecha_vencimiento: '2026-10-25',
    sucursal_id: '1',
    estado: 'PAGADO',
    abonos: [
      {
        id: 102,
        fecha: '2026-10-24',
        monto: 1200.00,
        metodo_pago: 'Transferencia BCP',
        referencia: 'Operación 7845129',
        usuario: 'Alexander Lee (Master)'
      }
    ]
  },
  {
    id: 4,
    tipo: 'POR_PAGAR',
    cliente_proveedor_nombre: 'Distribuidora Textil Lima SAC',
    tipo_documento: 'RUC',
    documento_identidad: '20555666777',
    comprobante_referencia: 'F002-0008921',
    concepto: 'Adquisición de telas e insumos confección lote verano',
    tiene_credito_fiscal_igv: true,
    monto_total: 3500.00,
    monto_pagado: 1000.00,
    saldo_pendiente: 2500.00,
    fecha_emision: '2026-10-15',
    fecha_vencimiento: '2026-11-15',
    sucursal_id: '1',
    estado: 'PARCIAL',
    abonos: [
      {
        id: 103,
        fecha: '2026-10-18',
        monto: 1000.00,
        metodo_pago: 'Transferencia BCP',
        referencia: 'Op. 8831024',
        usuario: 'Alexander Lee (Master)'
      }
    ]
  },
  {
    id: 5,
    tipo: 'POR_PAGAR',
    cliente_proveedor_nombre: 'Logística & Fletes del Perú SAC',
    tipo_documento: 'RUC',
    documento_identidad: '20444333222',
    comprobante_referencia: 'F001-0003310',
    concepto: 'Transporte interprovincial de mercadería Lima - Arequipa',
    tiene_credito_fiscal_igv: true,
    monto_total: 800.00,
    monto_pagado: 0.00,
    saldo_pendiente: 800.00,
    fecha_emision: '2026-10-24',
    fecha_vencimiento: '2026-11-08',
    sucursal_id: '3',
    estado: 'PENDIENTE',
    abonos: []
  }
];

// ── Datos Iniciales Simulados: Rendiciones de Gastos (RN-02, RN-03) ────────────
const DEFAULT_RENDICIONES_GASTOS = [
  {
    id: 1,
    categoria: 'ALQUILER', // 'ALQUILER' | 'LUZ_AGUA' | 'FLETE_TRANSPORTE' | 'INSUMOS_TIENDA' | 'OTROS'
    concepto: 'Pago mensual de alquiler de local comercial Sede Norte',
    monto: 2400.00,
    tiene_credito_fiscal_igv: true,
    subtotal_sin_igv: 2033.90, // RN-02: total / 1.18
    monto_igv: 366.10,         // RN-02: pasivo fiscal
    comprobante_referencia: 'F001-0004589 (Inmobiliaria Norte SAC)',
    usuario_responsable: 'Juan Perez',
    sucursal_id: '2',
    fecha_solicitud: '2026-10-28',
    fecha_resolucion: null,
    estado: 'PENDIENTE_APROBACION', // 'PENDIENTE_APROBACION' | 'APROBADO' | 'RECHAZADO'
    motivo_rechazo: '',
    observaciones: 'Pago correspondiente al mes de Noviembre 2026.'
  },
  {
    id: 2,
    categoria: 'FLETE_TRANSPORTE',
    concepto: 'Flete por traslado de mercadería Almacén Central a Sede Norte',
    monto: 350.00,
    tiene_credito_fiscal_igv: true,
    subtotal_sin_igv: 296.61,
    monto_igv: 53.39,
    comprobante_referencia: 'F005-0012 (Transportes Rápidos SAC)',
    usuario_responsable: 'Carlos Lopez',
    sucursal_id: '1',
    fecha_solicitud: '2026-10-27',
    fecha_resolucion: '2026-10-28',
    estado: 'APROBADO',
    usuario_aprobador: 'Alexander Lee (Master)',
    motivo_rechazo: '',
    observaciones: 'Aprobado de urgencia por abastecimiento de fin de semana.'
  },
  {
    id: 3,
    categoria: 'LUZ_AGUA',
    concepto: 'Servicio de energía eléctrica y agua Sede Principal',
    monto: 620.00,
    tiene_credito_fiscal_igv: true,
    subtotal_sin_igv: 525.42,
    monto_igv: 94.58,
    comprobante_referencia: 'Recibo Enel 8892110',
    usuario_responsable: 'Alexander Lee',
    sucursal_id: '1',
    fecha_solicitud: '2026-10-24',
    fecha_resolucion: '2026-10-25',
    estado: 'APROBADO',
    usuario_aprobador: 'Alexander Lee (Master)',
    motivo_rechazo: '',
    observaciones: 'Facturación regular de servicios básicos.'
  },
  {
    id: 4,
    categoria: 'INSUMOS_TIENDA',
    concepto: 'Compra de bolsas biodegradables y cinta de embalaje',
    monto: 180.00,
    tiene_credito_fiscal_igv: false,
    subtotal_sin_igv: 180.00,
    monto_igv: 0.00,
    comprobante_referencia: 'Ticket 44020 (Comercializadora El Sol)',
    usuario_responsable: 'Maria Gomez',
    sucursal_id: '3',
    fecha_solicitud: '2026-10-26',
    fecha_resolucion: '2026-10-26',
    estado: 'RECHAZADO',
    usuario_aprobador: 'Alexander Lee (Master)',
    motivo_rechazo: 'Ticket simple sin RUC, no permite deducción tributaria.',
    observaciones: 'Por favor solicitar factura con RUC de la empresa.'
  }
];

export const FinanzasProvider = ({ children }) => {
  const { user } = useAuth();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const requireAccess = (module, action, record) => {
    if (!can(module, action) || (!isGlobalScope && String(record?.sucursal_id ?? record?.sucursalId) !== String(effectiveSucursalId))) {
      throw new Error('No tienes permiso para esta operación o sucursal.');
    }
  };
  const [ownsPOSLock, setOwnsPOSLock] = useState(false);
  useEffect(() => {
    if (!user?.id || !navigator.locks) return;
    const controller = new AbortController();
    let release;
    navigator.locks.request(`ersoft-pos-user-${user.id}`, { signal: controller.signal }, async () => {
      setOwnsPOSLock(true);
      await new Promise(resolve => { release = resolve; });
      setOwnsPOSLock(false);
    }).catch(error => { if (error.name !== 'AbortError') console.error('No se pudo reservar la sesión POS', error); });
    return () => { controller.abort(); release?.(); };
  }, [user?.id]);
  const [ventas, setVentas] = useState(() => load('ersoft_comprobantes', []));
  useEffect(() => {
    const sync = () => setVentas(load('ersoft_comprobantes', []));
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('storage', sync); };
  }, []);

  // ── 0. Seguridad de Terminal y Detección de Dispositivo / IP (R7) ──
  const [realTerminal, setRealTerminal] = useState(() => getTerminalFingerprint());
  const [simularOtroDispositivo, setSimularOtroDispositivoState] = useState(() =>
    load(SIMULATION_STORAGE_KEY, false)
  );
  const [cajaSesiones, setCajaSesiones] = useState(() => load('ersoft_caja_sesiones', []));

  useEffect(() => {
    const syncCaja = () => setCajaSesiones(load('ersoft_caja_sesiones', []));
    window.addEventListener('focus', syncCaja);
    window.addEventListener('storage', syncCaja);
    return () => {
      window.removeEventListener('focus', syncCaja);
      window.removeEventListener('storage', syncCaja);
    };
  }, []);

  const setSimularOtroDispositivo = (val) => {
    setSimularOtroDispositivoState(val);
    save(SIMULATION_STORAGE_KEY, val);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/session/device', { signal: controller.signal, credentials: 'same-origin' })
      .then(response => { if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Servicio de IP no configurado'); return response.json(); })
      .then(data => { if (typeof data.ip === 'string') setRealTerminal(previous => ({ ...previous, ip_detectada: data.ip })); })
      .catch(() => { /* La IP permanece desconocida si no hay servidor configurado. */ });
    return () => controller.abort();
  }, []);
  const activeTerminal = import.meta.env.DEV && simularOtroDispositivo ? SIMULATED_REMOTE_DEVICE : realTerminal;

  const currentBranchId = String(effectiveSucursalId ?? '1');
  const getActiveCajaByBranch = (branchId) => findCashSession(cajaSesiones, branchId);
  const activeBranchCajaSesion = getActiveCajaByBranch(currentBranchId);
  const isCajaBlockedForCurrentUser = (branchId) => ({
    blocked: !ownsPOSLock || !canUseCashSession(getActiveCajaByBranch(branchId), user, activeTerminal, branchId),
  });
  const isTerminalBlocked = Boolean(activeBranchCajaSesion && isCajaBlockedForCurrentUser(currentBranchId).blocked);
  const canOperatePOS = Boolean(can('ventas_caja', 'CREAR') && activeBranchCajaSesion && !isTerminalBlocked);
  const assertCanOperatePOS = (branchId) => {
    const session = findCashSession(load('ersoft_caja_sesiones', []), branchId);
    if (!can('ventas_caja', 'CREAR') || !ownsPOSLock || !canUseCashSession(session, user, activeTerminal, branchId)) {
      throw new Error('Abre tu caja en esta terminal y cierra la otra pestaña operativa antes de vender.');
    }
    return session;
  };
  const syncCajaSessions = () => setCajaSesiones(load('ersoft_caja_sesiones', []));

  // Desbloqueo forzado por MASTER
  const desbloquearTerminalMaster = (sessionId, masterUser) => {
    if (user?.rol !== 'MASTER' || !can('desbloquear_terminal_caja', 'EDITAR')) throw new Error('Solo MASTER puede desbloquear una terminal.');
    const rawSessions = load('ersoft_caja_sesiones', []);
    let prev = null;
    let updated = null;

    const next = rawSessions.map(s => {
      if (s.id === sessionId && isOpenCashSession(s)) {
        prev = { ...s };
        updated = {
          ...s,
          terminal_id: activeTerminal.terminal_id,
          ip_detectada: activeTerminal.ip_detectada,
          navegador_so: activeTerminal.navegador_so,
          desbloqueado_por_master: true,
          desbloqueado_fecha: new Date().toISOString(),
          desbloqueado_por: masterUser?.name || 'Alexander Lee (Master)'
        };
        return updated;
      }
      return s;
    });

    save('ersoft_caja_sesiones', next);
    setCajaSesiones(next);

    logAuditAction({
      usuario: masterUser?.name || 'Alexander Lee (Master)',
      sucursalId: updated?.sucursalId || currentBranchId,
      modulo: 'CAJA',
      tipoAccion: 'EDITAR',
      descripcion: `Desbloqueo forzado de terminal en sesión de caja ${sessionId || updated?.id} por MASTER. Terminal anterior: ${prev?.terminal_id || 'N/A'} -> Nueva terminal autorizada: ${activeTerminal.terminal_id}`,
      datosPrevios: { terminal_id: prev?.terminal_id, ip_detectada: prev?.ip_detectada },
      datosNuevos: { terminal_id: activeTerminal.terminal_id, ip_detectada: activeTerminal.ip_detectada },
      ip: activeTerminal.ip_detectada
    });

    return updated;
  };

  // ── 1. Balances Iniciales ──────────────────────────────────────────
  const [balancesIniciales, setBalancesIniciales] = useState(() =>
    load('ersoft_balances_iniciales', DEFAULT_BALANCES_INICIALES)
  );

  // ── 2. Cuentas por Cobrar y por Pagar ──────────────────────────────
  const [cuentasCobrarPagar, setCuentasCobrarPagar] = useState(() =>
    load('ersoft_cuentas_cobrar_pagar', DEFAULT_CUENTAS_COBRAR_PAGAR)
  );

  // ── 3. Rendiciones de Gastos Operativos ────────────────────────────
  const [rendicionesGastos, setRendicionesGastos] = useState(() =>
    load('ersoft_rendiciones_gastos', DEFAULT_RENDICIONES_GASTOS)
  );

  // ── Balance Inicial CRUD ────────────────────────────────────────────
  const addBalanceInicial = (balanceData) => {
    requireAccess('tesoreria_balance', 'CREAR', balanceData);
    if (!Number.isFinite(Number(balanceData.monto)) || Number(balanceData.monto) < 0) throw new Error('Monto inicial inválido.');
    if (balancesIniciales.some(b => b.tipo === balanceData.tipo && String(b.sucursal_id) === String(balanceData.sucursal_id))) throw new Error('Ya existe un asiento inicial de este tipo en la sucursal.');
    const nuevoBalance = {
      ...balanceData,
      id: Date.now(),
      fecha: balanceData.fecha || new Date().toISOString().split('T')[0],
      moneda: balanceData.moneda || 'PEN',
      monto: parseFloat(balanceData.monto) || 0
    };
    const updated = [nuevoBalance, ...balancesIniciales];
    setBalancesIniciales(updated);
    save('ersoft_balances_iniciales', updated);

    logAuditAction({
      usuario: nuevoBalance.usuario_registro || 'Usuario Actual',
      sucursalId: nuevoBalance.sucursal_id || '1',
      modulo: 'FINANZAS',
      tipoAccion: 'CREAR',
      descripcion: `Registro de Balance Inicial tipo ${nuevoBalance.tipo} por S/ ${nuevoBalance.monto.toFixed(2)}: ${nuevoBalance.concepto}`,
      datosNuevos: nuevoBalance
    });

    return nuevoBalance;
  };

  const updateBalanceInicial = (id, data) => {
    const current = balancesIniciales.find(row => row.id === id);
    requireAccess('tesoreria_balance', 'EDITAR', current);
    requireAccess('tesoreria_balance', 'EDITAR', { ...current, ...data });
    let prevItem = null;
    let nextItem = null;
    const updated = balancesIniciales.map((b) => {
      if (b.id === id) {
        prevItem = b;
        nextItem = { ...b, ...data, monto: data.monto !== undefined ? parseFloat(data.monto) : b.monto };
        return nextItem;
      }
      return b;
    });
    setBalancesIniciales(updated);
    save('ersoft_balances_iniciales', updated);

    if (prevItem && nextItem) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: nextItem.sucursal_id || '1',
        modulo: 'FINANZAS',
        tipoAccion: 'EDITAR',
        descripcion: `Actualización de Balance Inicial #${id} (${nextItem.tipo})`,
        datosPrevios: prevItem,
        datosNuevos: nextItem
      });
    }
  };

  const deleteBalanceInicial = (id) => {
    requireAccess('tesoreria_balance', 'EDITAR', balancesIniciales.find(row => row.id === id));
    const itemToDelete = balancesIniciales.find((b) => b.id === id);
    const updated = balancesIniciales.filter((b) => b.id !== id);
    setBalancesIniciales(updated);
    save('ersoft_balances_iniciales', updated);

    if (itemToDelete) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: itemToDelete.sucursal_id || '1',
        modulo: 'FINANZAS',
        tipoAccion: 'ELIMINAR',
        descripcion: `Eliminación de Balance Inicial #${id} (${itemToDelete.tipo}) por S/ ${itemToDelete.monto}`,
        datosPrevios: itemToDelete
      });
    }
  };

  // ── Cuentas por Cobrar y Pagar CRUD y Abonos ─────────────────────────
  const addCuenta = (cuentaData) => {
    requireAccess(cuentaData.tipo === 'POR_PAGAR' ? 'tesoreria_cxp' : 'ventas_caja', 'CREAR', cuentaData);
    const montoTotal = parseFloat(cuentaData.monto_total) || 0;
    const montoPagado = parseFloat(cuentaData.monto_pagado) || 0;
    const saldoPendiente = Math.max(0, montoTotal - montoPagado);
    let estado = cuentaData.estado || 'PENDIENTE';
    if (saldoPendiente === 0) estado = 'PAGADO';
    else if (montoPagado > 0) estado = 'PARCIAL';

    const nuevaCuenta = {
      ...cuentaData,
      moneda: cuentaData.moneda || 'PEN',
      id: Date.now(),
      monto_total: montoTotal,
      monto_pagado: montoPagado,
      saldo_pendiente: saldoPendiente,
      fecha_emision: cuentaData.fecha_emision || new Date().toISOString().split('T')[0],
      estado,
      abonos: cuentaData.abonos || []
    };

    const updated = [nuevaCuenta, ...cuentasCobrarPagar];
    setCuentasCobrarPagar(updated);
    save('ersoft_cuentas_cobrar_pagar', updated);

    logAuditAction({
      usuario: 'Usuario Actual',
      sucursalId: nuevaCuenta.sucursal_id || '1',
      modulo: 'FINANZAS',
      tipoAccion: 'CREAR',
      descripcion: `Nueva cuenta ${nuevaCuenta.tipo} registrada para ${nuevaCuenta.cliente_proveedor_nombre} por S/ ${nuevaCuenta.monto_total.toFixed(2)}`,
      datosNuevos: nuevaCuenta
    });

    return nuevaCuenta;
  };

  const updateCuenta = (id, data) => {
    const current = cuentasCobrarPagar.find(row => row.id === id);
    const isScheduleChange = Object.keys(data).every(key => ['fecha_vencimiento', 'tarea_calendario_completada', 'responsable_calendario'].includes(key));
    requireAccess(isScheduleChange ? 'reprogramar_calendario' : 'rendiciones_cxc_cxp', 'EDITAR', current);
    if (!isScheduleChange) requireAccess('rendiciones_cxc_cxp', 'EDITAR', { ...current, ...data });
    let prevItem = null;
    let nextItem = null;
    const updated = cuentasCobrarPagar.map((c) => {
      if (c.id === id) {
        prevItem = c;
        const total = data.monto_total !== undefined ? parseFloat(data.monto_total) : c.monto_total;
        const pagado = data.monto_pagado !== undefined ? parseFloat(data.monto_pagado) : c.monto_pagado;
        const saldo = Math.max(0, total - pagado);
        nextItem = {
          ...c,
          ...data,
          monto_total: total,
          monto_pagado: pagado,
          saldo_pendiente: saldo
        };
        return nextItem;
      }
      return c;
    });
    setCuentasCobrarPagar(updated);
    save('ersoft_cuentas_cobrar_pagar', updated);

    if (prevItem && nextItem) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: nextItem.sucursal_id || '1',
        modulo: 'FINANZAS',
        tipoAccion: 'EDITAR',
        descripcion: `Actualización de cuenta ${nextItem.tipo} #${id} (${nextItem.cliente_proveedor_nombre})`,
        datosPrevios: prevItem,
        datosNuevos: nextItem
      });
    }
  };

  const deleteCuenta = (id) => {
    requireAccess('rendiciones_cxc_cxp', 'ANULAR', cuentasCobrarPagar.find(row => row.id === id));
    const itemToDelete = cuentasCobrarPagar.find((c) => c.id === id);
    const updated = cuentasCobrarPagar.filter((c) => c.id !== id);
    setCuentasCobrarPagar(updated);
    save('ersoft_cuentas_cobrar_pagar', updated);

    if (itemToDelete) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: itemToDelete.sucursal_id || '1',
        modulo: 'FINANZAS',
        tipoAccion: 'ELIMINAR',
        descripcion: `Eliminación de cuenta ${itemToDelete.tipo} #${id} (${itemToDelete.cliente_proveedor_nombre})`,
        datosPrevios: itemToDelete
      });
    }
  };

  /**
   * Registrar un abono a una cuenta por cobrar o por pagar.
   * Actualiza montos y estado automáticamente e inserta evento de auditoría.
   */
  const registrarAbonoCuenta = (cuentaId, { monto, metodoPago = 'Efectivo', referencia = '', usuario = 'Usuario' }) => {
    const freshAccounts = load('ersoft_cuentas_cobrar_pagar', cuentasCobrarPagar);
    const current = freshAccounts.find(c => c.id === cuentaId);
    if (!current) throw new Error('La cuenta ya no existe.');
    requireAccess(current.tipo === 'POR_COBRAR' ? 'tesoreria_cxc' : 'tesoreria_cxp', 'EDITAR', current);
    if (current.estado === 'ANULADO' || Number(current.saldo_pendiente) <= 0) throw new Error('La cuenta está pagada o anulada.');
    const abonoMonto = Math.round(Number(monto) * 100) / 100;
    if (abonoMonto > Number(current.saldo_pendiente)) throw new Error('El abono excede el saldo actualizado.');
    const cashSession = metodoPago === 'Efectivo' ? assertCanOperatePOS(current.sucursal_id) : null;
    if (cashSession && current.moneda && current.moneda !== 'PEN') throw new Error('La caja opera en PEN. Registra el abono en otra moneda por transferencia.');
    if (!Number.isFinite(abonoMonto) || abonoMonto <= 0) {
      throw new Error('El monto del abono debe ser mayor a 0');
    }

    let prevCuenta = null;
    let nextCuenta = null;

    const updated = freshAccounts.map((c) => {
      if (c.id === cuentaId) {
        prevCuenta = { ...c };
        const nuevoPagado = parseFloat((Number(c.monto_pagado) + abonoMonto).toFixed(2));
        const nuevoSaldo = Math.max(0, parseFloat((c.monto_total - nuevoPagado).toFixed(2)));
        let nuevoEstado = nuevoSaldo === 0 ? 'PAGADO' : 'PARCIAL';

        const nuevoAbono = {
          id: Date.now(),
          fecha: new Date().toISOString().split('T')[0],
          monto: abonoMonto,
          caja_id: cashSession?.id,
          moneda: current.moneda || 'PEN',
          metodo_pago: metodoPago,
          referencia,
          usuario
        };

        nextCuenta = {
          ...c,
          monto_pagado: nuevoPagado,
          saldo_pendiente: nuevoSaldo,
          estado: nuevoEstado,
          abonos: [nuevoAbono, ...(c.abonos || [])]
        };
        return nextCuenta;
      }
      return c;
    });

    setCuentasCobrarPagar(updated);
    save('ersoft_cuentas_cobrar_pagar', updated);

    if (prevCuenta && nextCuenta) {
      logAuditAction({
        usuario,
        sucursalId: nextCuenta.sucursal_id || '1',
        modulo: 'FINANZAS',
        tipoAccion: 'EDITAR',
        descripcion: `Abono de S/ ${abonoMonto.toFixed(2)} registrado para ${nextCuenta.tipo} #${cuentaId} (${nextCuenta.cliente_proveedor_nombre}). Nuevo saldo: S/ ${nextCuenta.saldo_pendiente.toFixed(2)}`,
        datosPrevios: {
          monto_pagado: prevCuenta.monto_pagado,
          saldo_pendiente: prevCuenta.saldo_pendiente,
          estado: prevCuenta.estado
        },
        datosNuevos: {
          monto_pagado: nextCuenta.monto_pagado,
          saldo_pendiente: nextCuenta.saldo_pendiente,
          estado: nextCuenta.estado,
          metodo_pago: metodoPago
        }
      });
    }

    return nextCuenta;
  };

  // ── Rendiciones de Gastos Operativos CRUD ─────────────────────────
  /**
   * Crear nueva rendición con desglose automático de IGV 18% si tiene crédito fiscal (RN-02).
   */
  const crearRendicion = (rendicionData) => {
    requireAccess('tesoreria_gastos', 'CREAR', rendicionData);
    const monto = parseFloat(rendicionData.monto) || 0;
    const tieneCreditoFiscal = Boolean(rendicionData.tiene_credito_fiscal_igv);

    let subtotalSinIgv = monto;
    let montoIgv = 0;

    if (tieneCreditoFiscal) {
      // RN-02: subtotal_sin_igv = total / 1.18, igv = total - subtotal_sin_igv
      subtotalSinIgv = parseFloat((monto / 1.18).toFixed(2));
      montoIgv = parseFloat((monto - subtotalSinIgv).toFixed(2));
    }

    const nuevaRendicion = {
      ...rendicionData,
      id: Date.now(),
      monto,
      tiene_credito_fiscal_igv: tieneCreditoFiscal,
      subtotal_sin_igv: subtotalSinIgv,
      monto_igv: montoIgv,
      fecha_solicitud: rendicionData.fecha_solicitud || new Date().toISOString().split('T')[0],
      fecha_resolucion: null,
      estado: 'PENDIENTE_APROBACION',
      motivo_rechazo: '',
      usuario_responsable: rendicionData.usuario_responsable || 'Usuario Responsable',
      usuario_aprobador: null
    };

    const updated = [nuevaRendicion, ...rendicionesGastos];
    setRendicionesGastos(updated);
    save('ersoft_rendiciones_gastos', updated);

    logAuditAction({
      usuario: nuevaRendicion.usuario_responsable,
      sucursalId: nuevaRendicion.sucursal_id || '1',
      modulo: 'RENDICIONES',
      tipoAccion: 'CREAR',
      descripcion: `Solicitud de rendición de gasto ${nuevaRendicion.categoria} por S/ ${monto.toFixed(2)} (${nuevaRendicion.concepto})`,
      datosNuevos: nuevaRendicion
    });

    return nuevaRendicion;
  };

  const updateRendicion = (id, data) => {
    requireAccess('tesoreria_gastos', 'EDITAR', rendicionesGastos.find(r => r.id === id));
    let prevItem = null;
    let nextItem = null;

    const updated = rendicionesGastos.map((r) => {
      if (r.id === id) {
        prevItem = r;
        const monto = data.monto !== undefined ? parseFloat(data.monto) : r.monto;
        const tieneCreditoFiscal = data.tiene_credito_fiscal_igv !== undefined ? Boolean(data.tiene_credito_fiscal_igv) : r.tiene_credito_fiscal_igv;
        let subtotalSinIgv = monto;
        let montoIgv = 0;
        if (tieneCreditoFiscal) {
          subtotalSinIgv = parseFloat((monto / 1.18).toFixed(2));
          montoIgv = parseFloat((monto - subtotalSinIgv).toFixed(2));
        }

        nextItem = {
          ...r,
          ...data,
          monto,
          tiene_credito_fiscal_igv: tieneCreditoFiscal,
          subtotal_sin_igv: subtotalSinIgv,
          monto_igv: montoIgv
        };
        return nextItem;
      }
      return r;
    });

    setRendicionesGastos(updated);
    save('ersoft_rendiciones_gastos', updated);

    if (prevItem && nextItem) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: nextItem.sucursal_id || '1',
        modulo: 'RENDICIONES',
        tipoAccion: 'EDITAR',
        descripcion: `Actualización de rendición #${id} (${nextItem.categoria})`,
        datosPrevios: prevItem,
        datosNuevos: nextItem
      });
    }
  };

  const deleteRendicion = (id) => {
    requireAccess('tesoreria_gastos', 'EDITAR', rendicionesGastos.find(r => r.id === id));
    const itemToDelete = rendicionesGastos.find((r) => r.id === id);
    const updated = rendicionesGastos.filter((r) => r.id !== id);
    setRendicionesGastos(updated);
    save('ersoft_rendiciones_gastos', updated);

    if (itemToDelete) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: itemToDelete.sucursal_id || '1',
        modulo: 'RENDICIONES',
        tipoAccion: 'ELIMINAR',
        descripcion: `Eliminación de solicitud de rendición #${id} (${itemToDelete.categoria}) por S/ ${itemToDelete.monto}`,
        datosPrevios: itemToDelete
      });
    }
  };

  /**
   * Aprobar o rechazar rendición de gastos operativos (RN-03, RN-04).
   * Si es aprobada, cuenta como gasto operativo deducible en el P&G.
   */
  const aprobarRechazarRendicion = (rendicionId, nuevoEstado, motivo = '', usuarioAprobador = 'Administrador') => {
    requireAccess('tesoreria_gastos', 'APROBAR_RENDICION', rendicionesGastos.find(r => r.id === rendicionId));
    if (!['APROBADO', 'RECHAZADO'].includes(nuevoEstado)) {
      throw new Error('El estado debe ser APROBADO o RECHAZADO');
    }

    let prevItem = null;
    let nextItem = null;

    const updated = rendicionesGastos.map((r) => {
      if (r.id === rendicionId) {
        prevItem = { ...r };
        nextItem = {
          ...r,
          estado: nuevoEstado,
          fecha_resolucion: new Date().toISOString().split('T')[0],
          motivo_rechazo: nuevoEstado === 'RECHAZADO' ? motivo : '',
          usuario_aprobador: usuarioAprobador
        };
        return nextItem;
      }
      return r;
    });

    setRendicionesGastos(updated);
    save('ersoft_rendiciones_gastos', updated);

    if (prevItem && nextItem) {
      logAuditAction({
        usuario: usuarioAprobador,
        sucursalId: nextItem.sucursal_id || '1',
        modulo: 'RENDICIONES',
        tipoAccion: nuevoEstado === 'APROBADO' ? 'APROBAR' : 'EDITAR',
        descripcion: `${nuevoEstado === 'APROBADO' ? 'Aprobación' : 'Rechazo'} de rendición #${rendicionId} (${nextItem.categoria}) por S/ ${nextItem.monto.toFixed(2)}${motivo ? ' - Motivo: ' + motivo : ''}`,
        datosPrevios: { estado: prevItem.estado },
        datosNuevos: { estado: nextItem.estado, motivo_rechazo: nextItem.motivo_rechazo, usuario_aprobador: usuarioAprobador }
      });
    }

    return nextItem;
  };

  // ── Resumen Financiero Calculado ───────────────────────────────────
  const registrarVenta = (venta) => {
    assertCanOperatePOS(venta.sucursal_id || venta.sucursalId || currentBranchId);
    const saved = load('ersoft_comprobantes', []);
    if (saved.some(v => v.id === venta.id)) return false;
    const credit = venta.condicion_pago === 'CREDITO';
    if (credit && (!venta.fecha_vencimiento || venta.fecha_vencimiento < todayLima())) throw new Error('Fecha de vencimiento inválida.');
    // A credit sale is accrued immediately; only subsequent abonos are cash flow.
    if (credit && !cuentasCobrarPagar.some(c => c.comprobante_referencia === venta.id)) {
      addCuenta({ tipo: 'POR_COBRAR', cliente_proveedor_nombre: `${venta.cliente.nombre} ${venta.cliente.apellidos || ''}`.trim(),
        tipo_documento: venta.cliente.docType, documento_identidad: venta.cliente.documento,
        comprobante_referencia: venta.id, concepto: `Venta a crédito ${venta.id}`, monto_total: venta.total,
        monto_pagado: 0, fecha_emision: todayLima(), fecha_vencimiento: venta.fecha_vencimiento,
        sucursal_id: String(venta.sucursalId), abonos: [] });
    }
    const next = [venta, ...saved];
    localStorage.setItem('ersoft_comprobantes', JSON.stringify(next));
    setVentas(next);
    logAuditAction({ usuario: venta.vendedor, sucursalId: venta.sucursalId, modulo: 'VENTAS', tipoAccion: 'CREAR',
      descripcion: `Emisión de ${venta.id} (${venta.condicion_pago})`, datosNuevos: venta });
    return true;
  };

  const calcularResumenFinanzas = (sucursalId = null) => {
    const filterBySucursal = (arr) => {
      if (!sucursalId || sucursalId === 'TODOS' || sucursalId === 'global') return arr;
      return arr.filter((x) => String(x.sucursal_id) === String(sucursalId));
    };

    const balances = filterBySucursal(balancesIniciales);
    const cuentas = filterBySucursal(cuentasCobrarPagar);
    const rendiciones = filterBySucursal(rendicionesGastos);

    const totalCapitalCaja = balances
      .filter((b) => b.tipo === 'CAPITAL_CAJA')
      .reduce((s, b) => s + b.monto, 0);

    const totalCapitalBanco = balances
      .filter((b) => b.tipo === 'CAPITAL_BANCO')
      .reduce((s, b) => s + b.monto, 0);

    const totalInventarioApertura = balances
      .filter((b) => b.tipo === 'INVENTARIO_APERTURA')
      .reduce((s, b) => s + b.monto, 0);

    const totalPorCobrar = cuentas
      .filter((c) => c.tipo === 'POR_COBRAR' && c.estado !== 'PAGADO')
      .reduce((s, c) => s + c.saldo_pendiente, 0);

    const totalPorPagar = cuentas
      .filter((c) => c.tipo === 'POR_PAGAR' && c.estado !== 'PAGADO')
      .reduce((s, c) => s + c.saldo_pendiente, 0);

    const totalGastosRendicionesAprobadas = rendiciones
      .filter((r) => r.estado === 'APROBADO')
      .reduce((s, r) => s + r.monto, 0);

    const totalCreditoFiscalRendiciones = rendiciones
      .filter((r) => r.estado === 'APROBADO' && r.tiene_credito_fiscal_igv)
      .reduce((s, r) => s + (r.monto_igv || 0), 0);

    return {
      totalCapitalCaja,
      totalCapitalBanco,
      totalInventarioApertura,
      totalPatrimonioInicial: totalCapitalCaja + totalCapitalBanco + totalInventarioApertura,
      totalPorCobrar,
      totalPorPagar,
      totalGastosRendicionesAprobadas,
      totalCreditoFiscalRendiciones
    };
  };

  const refreshFinanzas = () => {
    setVentas(load('ersoft_comprobantes', []));
    setBalancesIniciales(load('ersoft_balances_iniciales', DEFAULT_BALANCES_INICIALES));
    setCuentasCobrarPagar(load('ersoft_cuentas_cobrar_pagar', DEFAULT_CUENTAS_COBRAR_PAGAR));
    setRendicionesGastos(load('ersoft_rendiciones_gastos', DEFAULT_RENDICIONES_GASTOS));
    setCajaSesiones(load('ersoft_caja_sesiones', []));
  };

  return (
    <FinanzasContext.Provider
      value={{
        ventas, registrarVenta,
        // Seguridad de Terminal y Caja (R7)
        terminalInfo: activeTerminal,
        realTerminalInfo: realTerminal,
        simularOtroDispositivo,
        setSimularOtroDispositivo,
        canOperatePOS,
        ownsPOSLock,
        syncCajaSessions,
        getActiveCajaByBranch,
        isCajaBlockedForCurrentUser,
        assertCanOperatePOS,
        isTerminalBlocked,
        activeBranchCajaSesion,
        cajaSesiones,
        desbloquearTerminalMaster,

        // Balances Iniciales
        balancesIniciales,
        addBalanceInicial,
        updateBalanceInicial,
        deleteBalanceInicial,

        // Cuentas por Cobrar y Pagar
        cuentasCobrarPagar,
        addCuenta,
        updateCuenta,
        deleteCuenta,
        registrarAbonoCuenta,

        // Rendiciones de Gastos
        rendicionesGastos,
        crearRendicion,
        updateRendicion,
        deleteRendicion,
        aprobarRechazarRendicion,

        // Resumen y Utilidades
        calcularResumenFinanzas,
        refreshFinanzas
      }}
    >
      {children}
    </FinanzasContext.Provider>
  );
};
