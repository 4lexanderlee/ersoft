/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { simulatedClients } from '../data/simulatedClients';
import { logAuditAction } from '../data/simulatedAudit';
import { todayLima } from '../utils/businessData';

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM debe ser utilizado dentro de un CRMProvider');
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

// ── Datos Iniciales Simulados: Oportunidades del Embudo ─────────────────────────
const DEFAULT_OPORTUNIDADES = [
  {
    id: 1,
    oportunidad_id: 'OPP-101',
    cliente_id: 22,
    cliente_nombre: 'Constructora B EIRL',
    tipo_documento: 'RUC',
    documento: '20600000002',
    sucursal_id: '1',
    titulo_pedido: 'Dotación Uniformes y EPP Campaña Verano',
    etapa: 'PROSPECTO', // 'PROSPECTO' | 'CONTACTADO' | 'COTIZADO' | 'GANADO' | 'PERDIDO'
    monto_estimado: 4800.00,
    fecha_estimada_cierre: '2026-11-20',
    fecha_creacion: '2026-10-25',
    prioridad: 'ALTA',
    vendedor_asignado: 'Carlos Lopez',
    motivo_perdida: '',
    items_cotizados: [
      { id: 101, tipo: 'Producto', nombre: 'Polo Manga Corta Algodón 20/1', cantidad: 60, precio: 35.00, subtotal: 2100.00 },
      { id: 102, tipo: 'Producto', nombre: 'Pantalón Cargo Drill Reforzado', cantidad: 30, precio: 65.00, subtotal: 1950.00 },
      { id: 103, tipo: 'Producto', nombre: 'Chaleco de Seguridad Reflectivo', cantidad: 30, precio: 25.00, subtotal: 750.00 }
    ]
  },
  {
    id: 2,
    oportunidad_id: 'OPP-102',
    cliente_id: 23,
    cliente_nombre: 'Servicios C SA',
    tipo_documento: 'RUC',
    documento: '20600000003',
    sucursal_id: '1',
    titulo_pedido: 'Mantenimiento preventivo e insumos de oficina',
    etapa: 'CONTACTADO',
    monto_estimado: 3200.00,
    fecha_estimada_cierre: '2026-11-15',
    fecha_creacion: '2026-10-26',
    prioridad: 'MEDIA',
    vendedor_asignado: 'Carlos Lopez',
    motivo_perdida: '',
    items_cotizados: [
      { id: 104, tipo: 'Servicio', nombre: 'Servicio Mantenimiento Equipos', cantidad: 2, precio: 600.00, subtotal: 1200.00 },
      { id: 105, tipo: 'Producto', nombre: 'Pack Papelería y Consumibles', cantidad: 10, precio: 200.00, subtotal: 2000.00 }
    ]
  },
  {
    id: 3,
    oportunidad_id: 'OPP-103',
    cliente_id: 21,
    cliente_nombre: 'Empresa A SAC',
    tipo_documento: 'RUC',
    documento: '20600000001',
    sucursal_id: '2',
    titulo_pedido: 'Suministro mayorista de mercadería para sucursal Norte',
    etapa: 'COTIZADO',
    monto_estimado: 6450.00,
    fecha_estimada_cierre: '2026-11-10',
    fecha_creacion: '2026-10-20',
    prioridad: 'ALTA',
    vendedor_asignado: 'Juan Perez',
    motivo_perdida: '',
    items_cotizados: [
      { id: 106, tipo: 'Producto', nombre: 'Camisa Oxford Corporativa', cantidad: 80, precio: 45.00, subtotal: 3600.00 },
      { id: 107, tipo: 'Producto', nombre: 'Pantalón de Vestir', cantidad: 50, precio: 57.00, subtotal: 2850.00 }
    ]
  },
  {
    id: 4,
    oportunidad_id: 'OPP-104',
    cliente_id: 1,
    cliente_nombre: 'Juan Perez',
    tipo_documento: 'DNI',
    documento: '10000001',
    sucursal_id: '1',
    titulo_pedido: 'Pedido mayorista para feria local',
    etapa: 'GANADO',
    monto_estimado: 1450.00,
    fecha_estimada_cierre: '2026-10-28',
    fecha_creacion: '2026-10-18',
    prioridad: 'MEDIA',
    vendedor_asignado: 'Alexander Lee',
    motivo_perdida: '',
    items_cotizados: [
      { id: 108, tipo: 'Producto', nombre: 'Bermuda Casual Verano', cantidad: 25, precio: 38.00, subtotal: 950.00 },
      { id: 109, tipo: 'Producto', nombre: 'Gorra Deportiva UV', cantidad: 25, precio: 20.00, subtotal: 500.00 }
    ]
  },
  {
    id: 5,
    oportunidad_id: 'OPP-105',
    cliente_id: 24,
    cliente_nombre: 'Comercializadora D',
    tipo_documento: 'RUC',
    documento: '20600000004',
    sucursal_id: '3',
    titulo_pedido: 'Campaña invierno anticipada para distribución Sur',
    etapa: 'PERDIDO',
    monto_estimado: 5000.00,
    fecha_estimada_cierre: '2026-10-22',
    fecha_creacion: '2026-10-05',
    prioridad: 'BAJA',
    vendedor_asignado: 'Maria Gomez',
    motivo_perdida: 'Cliente optó por proveedor local en Arequipa con menor tiempo de entrega.',
    items_cotizados: [
      { id: 110, tipo: 'Producto', nombre: 'Casaca Térmica Impermeable', cantidad: 50, precio: 100.00, subtotal: 5000.00 }
    ]
  }
];

// ── Datos Iniciales Simulados: Seguimientos / Bitácora de Contacto ─────────────
const DEFAULT_SEGUIMIENTOS = [
  {
    id: 1,
    oportunidad_id: 'OPP-101',
    cliente_id: 22,
    tipo_contacto: 'WHATSAPP', // 'WHATSAPP' | 'LLAMADA' | 'VISITA_LOCAL' | 'CORREO'
    detalle_conversacion: 'Se envió catálogo en PDF y tabla de tallas por WhatsApp al Jefe de Compras Ing. Morales.',
    fecha_contacto: '2026-10-25',
    fecha_proximo_contacto: '2026-10-30',
    realizado: true,
    usuario_registro: 'Carlos Lopez (Cajero)'
  },
  {
    id: 2,
    oportunidad_id: 'OPP-102',
    cliente_id: 23,
    tipo_contacto: 'LLAMADA',
    detalle_conversacion: 'Llamada telefónica de 10 min. Cliente confirmó recepción de propuesta y solicitó descuento por pago al contado.',
    fecha_contacto: '2026-10-26',
    fecha_proximo_contacto: '2026-11-02',
    realizado: true,
    usuario_registro: 'Carlos Lopez (Cajero)'
  },
  {
    id: 3,
    oportunidad_id: 'OPP-103',
    cliente_id: 21,
    tipo_contacto: 'VISITA_LOCAL',
    detalle_conversacion: 'Reunión presencial en Sede Norte para coordinar muestras físicas de tela y aprobación de bordado institucional.',
    fecha_contacto: '2026-10-27',
    fecha_proximo_contacto: '2026-11-05',
    realizado: true,
    usuario_registro: 'Juan Perez (Administrador)'
  },
  {
    id: 4,
    oportunidad_id: 'OPP-101',
    cliente_id: 22,
    tipo_contacto: 'CORREO',
    detalle_conversacion: 'Envío formal de cotización COT-2026-089 con desglose IGV 18% y condiciones comerciales a compras@constructorab.pe.',
    fecha_contacto: '2026-10-28',
    fecha_proximo_contacto: '2026-11-04',
    realizado: false,
    usuario_registro: 'Carlos Lopez (Cajero)'
  }
];

export const CRMProvider = ({ children }) => {
  // ── 1. Oportunidades del embudo ────────────────────────────────────
  const [oportunidades, setOportunidades] = useState(() =>
    load('ersoft_crm_oportunidades', DEFAULT_OPORTUNIDADES)
  );

  // ── 2. Seguimientos / Bitácora ─────────────────────────────────────
  const [seguimientos, setSeguimientos] = useState(() =>
    load('ersoft_crm_seguimientos', DEFAULT_SEGUIMIENTOS)
  );

  // ── 3. Pedido pre-cargado temporal para POS (Ventas.jsx) ───────────
  const [posPreload, setPosPreload] = useState(() =>
    load('ersoft_crm_pos_preload', null)
  );

  // ── CRUD de Oportunidades ──────────────────────────────────────────
  const addOportunidad = (opData) => {
    const timestamp = Date.now();
    const count = oportunidades.length + 1;
    const items = opData.items_cotizados || [];
    const montoCalculado = items.reduce((sum, item) => sum + ((parseFloat(item.precio) || 0) * (parseFloat(item.cantidad) || 1)), 0);

    const nuevaOportunidad = {
      ...opData,
      id: timestamp,
      oportunidad_id: opData.oportunidad_id || `OPP-${100 + count}`,
      monto_estimado: opData.monto_estimado !== undefined ? parseFloat(opData.monto_estimado) : parseFloat(montoCalculado.toFixed(2)),
      items_cotizados: items,
      etapa: opData.etapa || 'PROSPECTO',
      fecha_creacion: opData.fecha_creacion || new Date().toISOString().split('T')[0],
      prioridad: opData.prioridad || 'MEDIA',
      motivo_perdida: opData.motivo_perdida || ''
    };

    const updated = [nuevaOportunidad, ...oportunidades];
    setOportunidades(updated);
    save('ersoft_crm_oportunidades', updated);

    logAuditAction({
      usuario: opData.vendedor_asignado || 'Usuario Actual',
      sucursalId: nuevaOportunidad.sucursal_id || '1',
      modulo: 'CRM',
      tipoAccion: 'CREAR',
      descripcion: `Creación de oportunidad comercial ${nuevaOportunidad.oportunidad_id}: "${nuevaOportunidad.titulo_pedido}" para cliente ${nuevaOportunidad.cliente_nombre}`,
      datosNuevos: nuevaOportunidad
    });

    return nuevaOportunidad;
  };

  const updateOportunidad = (id, data) => {
    let prevItem = null;
    let nextItem = null;

    const updated = oportunidades.map((op) => {
      if (op.id === id || op.oportunidad_id === id) {
        prevItem = op;
        nextItem = {
          ...op,
          ...data,
          monto_estimado: data.monto_estimado !== undefined ? parseFloat(data.monto_estimado) : op.monto_estimado
        };
        return nextItem;
      }
      return op;
    });

    setOportunidades(updated);
    save('ersoft_crm_oportunidades', updated);

    if (prevItem && nextItem) {
      logAuditAction({
        usuario: nextItem.vendedor_asignado || 'Usuario Actual',
        sucursalId: nextItem.sucursal_id || '1',
        modulo: 'CRM',
        tipoAccion: 'EDITAR',
        descripcion: `Actualización de oportunidad comercial ${nextItem.oportunidad_id} (${nextItem.cliente_nombre})`,
        datosPrevios: prevItem,
        datosNuevos: nextItem
      });
    }

    return nextItem;
  };

  const deleteOportunidad = (id) => {
    const itemToDelete = oportunidades.find((op) => op.id === id || op.oportunidad_id === id);
    const updated = oportunidades.filter((op) => op.id !== id && op.oportunidad_id !== id);
    setOportunidades(updated);
    save('ersoft_crm_oportunidades', updated);

    if (itemToDelete) {
      logAuditAction({
        usuario: 'Usuario Actual',
        sucursalId: itemToDelete.sucursal_id || '1',
        modulo: 'CRM',
        tipoAccion: 'ELIMINAR',
        descripcion: `Eliminación de oportunidad comercial ${itemToDelete.oportunidad_id} (${itemToDelete.cliente_nombre})`,
        datosPrevios: itemToDelete
      });
    }
  };

  /**
   * Mover una oportunidad entre etapas del embudo:
   * 'PROSPECTO' -> 'CONTACTADO' -> 'COTIZADO' -> 'GANADO' -> 'PERDIDO'
   */
  const moverEtapaOportunidad = (oportunidadId, nuevaEtapa, motivoPerdida = '') => {
    const validEtapas = ['PROSPECTO', 'CONTACTADO', 'COTIZADO', 'GANADO', 'PERDIDO'];
    if (!validEtapas.includes(nuevaEtapa)) {
      throw new Error(`Etapa no válida: ${nuevaEtapa}`);
    }

    let prevOp = null;
    let nextOp = null;

    const updated = oportunidades.map((op) => {
      if (op.id === oportunidadId || op.oportunidad_id === oportunidadId) {
        prevOp = { ...op };
        nextOp = {
          ...op,
          etapa: nuevaEtapa,
          motivo_perdida: nuevaEtapa === 'PERDIDO' ? motivoPerdida : (nuevaEtapa === 'GANADO' ? '' : op.motivo_perdida)
        };
        return nextOp;
      }
      return op;
    });

    setOportunidades(updated);
    save('ersoft_crm_oportunidades', updated);

    if (prevOp && nextOp) {
      logAuditAction({
        usuario: nextOp.vendedor_asignado || 'Usuario Actual',
        sucursalId: nextOp.sucursal_id || '1',
        modulo: 'CRM',
        tipoAccion: 'EDITAR',
        descripcion: `Oportunidad ${nextOp.oportunidad_id} cambió de etapa ${prevOp.etapa} a ${nuevaEtapa}${motivoPerdida ? ' - Motivo: ' + motivoPerdida : ''}`,
        datosPrevios: { etapa: prevOp.etapa, motivo_perdida: prevOp.motivo_perdida },
        datosNuevos: { etapa: nextOp.etapa, motivo_perdida: nextOp.motivo_perdida }
      });
    }

    return nextOp;
  };

  /**
   * Preparar el envío de una oportunidad al POS (Ventas.jsx).
   * Genera el cliente precargado y la lista de carrito lista para ser facturada.
   */
  const prepararEnvioAPOS = (oportunidadId) => {
    const op = oportunidades.find((o) => o.id === oportunidadId || o.oportunidad_id === oportunidadId);
    if (!op) {
      throw new Error(`No se encontró la oportunidad con id: ${oportunidadId}`);
    }

    // Buscar si existe cliente en simulatedClients para complementar datos
    const matchedClient = simulatedClients.find(
      (c) => c.id === op.cliente_id || (c.docNumber && c.docNumber === op.documento)
    );

    const preloadedClient = {
      id: op.cliente_id || matchedClient?.id || Date.now(),
      name: op.cliente_nombre || matchedClient?.name || '',
      surname: '',
      docType: op.tipo_documento || matchedClient?.docType || (op.documento?.length === 11 ? 'RUC' : 'DNI'),
      docNumber: op.documento || matchedClient?.docNumber || '',
      telefono: matchedClient?.telefono || op.telefono || '',
      correo: matchedClient?.correo || op.correo || ''
    };

    const cart = (op.items_cotizados || []).map((item, idx) => ({
      item: {
        ...item,
        id: item.id || (Date.now() + idx),
        nombre: item.nombre,
        precio: parseFloat(item.precio) || 0,
        tipo: item.tipo || 'Producto',
        _type: String(item.tipo).toUpperCase() === 'SERVICIO' ? 'Servicio' : 'Producto',
        _fromCRM: true,
        _crmSucursalId: String(op.sucursal_id || '1'),
      },
      qty: Number(item.cantidad) || 1
    }));

    const preloadPayload = {
      origen: 'CRM',
      oportunidadId: op.oportunidad_id || op.id,
      tituloPedido: op.titulo_pedido,
      sucursalId: op.sucursal_id,
      preloadedClient,
      cart,
      subtotalEstimado: op.monto_estimado,
      timestamp: Date.now()
    };

    setPosPreload(preloadPayload);
    save('ersoft_crm_pos_preload', preloadPayload);
    try {
      sessionStorage.setItem('ersoft_crm_pos_preload', JSON.stringify(preloadPayload));
    } catch (err) {
      console.warn('No se pudo guardar precarga POS en sessionStorage:', err);
    }

    logAuditAction({
      usuario: op.vendedor_asignado || 'Usuario Actual',
      sucursalId: op.sucursal_id || '1',
      modulo: 'CRM',
      tipoAccion: 'CREAR',
      descripcion: `Oportunidad ${op.oportunidad_id} preparada para emisión en POS (${cart.length} ítems cotizados para ${op.cliente_nombre})`,
      datosNuevos: { oportunidad_id: op.oportunidad_id, total_items: cart.length, cliente: op.cliente_nombre }
    });

    return preloadPayload;
  };

  /**
   * Limpiar la precarga una vez consumida en Ventas.jsx
   */
  const limpiarEnvioAPOS = () => {
    setPosPreload(null);
    try {
      localStorage.removeItem('ersoft_crm_pos_preload');
      sessionStorage.removeItem('ersoft_crm_pos_preload');
    } catch (err) {
      console.warn('Error al limpiar precarga POS:', err);
    }
  };

  // ── CRUD de Seguimientos / Bitácora ────────────────────────────────
  const addSeguimiento = (segData) => {
    const nuevoSeguimiento = {
      ...segData,
      id: Date.now(),
      fecha_contacto: segData.fecha_contacto || todayLima(),
      realizado: segData.realizado !== undefined ? Boolean(segData.realizado) : true,
      tipo_contacto: segData.tipo_contacto || 'WHATSAPP',
      usuario_registro: segData.usuario_registro || 'Usuario Actual'
    };

    const updated = [nuevoSeguimiento, ...seguimientos];
    setSeguimientos(updated);
    save('ersoft_crm_seguimientos', updated);

    logAuditAction({
      usuario: nuevoSeguimiento.usuario_registro,
      sucursalId: segData.sucursal_id || oportunidades.find(o => o.oportunidad_id === segData.oportunidad_id)?.sucursal_id,
      modulo: 'CRM',
      tipoAccion: 'CREAR',
      descripcion: `Registro de seguimiento (${nuevoSeguimiento.tipo_contacto}) para oportunidad ${nuevoSeguimiento.oportunidad_id}`,
      datosNuevos: nuevoSeguimiento
    });

    return nuevoSeguimiento;
  };

  const updateSeguimiento = (id, data) => {
    let prevItem = null;
    let nextItem = null;

    const updated = seguimientos.map((s) => {
      if (s.id === id) {
        prevItem = s;
        nextItem = { ...s, ...data };
        return nextItem;
      }
      return s;
    });

    setSeguimientos(updated);
    save('ersoft_crm_seguimientos', updated);

    if (prevItem && nextItem) {
      logAuditAction({
        usuario: 'Usuario Actual',
        modulo: 'CRM',
        tipoAccion: 'EDITAR',
        descripcion: `Actualización de seguimiento #${id} de oportunidad ${nextItem.oportunidad_id}`,
        datosPrevios: prevItem,
        datosNuevos: nextItem
      });
    }

    return nextItem;
  };

  const deleteSeguimiento = (id) => {
    const itemToDelete = seguimientos.find((s) => s.id === id);
    const updated = seguimientos.filter((s) => s.id !== id);
    setSeguimientos(updated);
    save('ersoft_crm_seguimientos', updated);

    if (itemToDelete) {
      logAuditAction({
        usuario: 'Usuario Actual',
        modulo: 'CRM',
        tipoAccion: 'ELIMINAR',
        descripcion: `Eliminación de seguimiento #${id} de oportunidad ${itemToDelete.oportunidad_id}`,
        datosPrevios: itemToDelete
      });
    }
  };

  const marcarSeguimientoRealizado = (id) => {
    return updateSeguimiento(id, { realizado: true });
  };

  // ── Helpers y Métricas de Embudo ───────────────────────────────────
  const getOportunidadesByEtapa = (etapa) => {
    if (!etapa || etapa === 'TODAS') return oportunidades;
    return oportunidades.filter((op) => op.etapa === etapa);
  };

  const getSeguimientosByOportunidad = (oportunidadId) => {
    return seguimientos.filter(
      (s) => s.oportunidad_id === oportunidadId || String(s.oportunidad_id) === String(oportunidadId)
    );
  };

  const calcularTotalesEmbudo = (sucursalId = null) => {
    const filterBySucursal = (arr) => {
      if (!sucursalId || sucursalId === 'TODOS' || sucursalId === 'global') return arr;
      return arr.filter((x) => String(x.sucursal_id) === String(sucursalId));
    };

    const lista = filterBySucursal(oportunidades);

    const etapas = ['PROSPECTO', 'CONTACTADO', 'COTIZADO', 'GANADO', 'PERDIDO'];
    const resumen = {};

    etapas.forEach((et) => {
      const items = lista.filter((o) => o.etapa === et);
      resumen[et] = {
        cantidad: items.length,
        monto: items.reduce((s, o) => s + (o.monto_estimado || 0), 0)
      };
    });

    const totalActivas = lista.filter((o) => ['PROSPECTO', 'CONTACTADO', 'COTIZADO'].includes(o.etapa));
    const valorPipeline = totalActivas.reduce((s, o) => s + (o.monto_estimado || 0), 0);

    return {
      porEtapa: resumen,
      totalOportunidades: lista.length,
      valorPipeline,
      totalGanado: resumen.GANADO?.monto || 0,
      totalPerdido: resumen.PERDIDO?.monto || 0
    };
  };

  const refreshCRM = () => {
    setOportunidades(load('ersoft_crm_oportunidades', DEFAULT_OPORTUNIDADES));
    setSeguimientos(load('ersoft_crm_seguimientos', DEFAULT_SEGUIMIENTOS));
    setPosPreload(load('ersoft_crm_pos_preload', null));
  };

  return (
    <CRMContext.Provider
      value={{
        // Oportunidades
        oportunidades,
        addOportunidad,
        updateOportunidad,
        deleteOportunidad,
        moverEtapaOportunidad,

        // Conexión con POS
        prepararEnvioAPOS,
        limpiarEnvioAPOS,
        posPreload,

        // Seguimientos
        seguimientos,
        addSeguimiento,
        updateSeguimiento,
        deleteSeguimiento,
        marcarSeguimientoRealizado,

        // Filtros y Métricas
        getOportunidadesByEtapa,
        getSeguimientosByOportunidad,
        calcularTotalesEmbudo,
        refreshCRM,

        // Acceso directo a clientes simulados
        clientesSimulados: simulatedClients
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};
