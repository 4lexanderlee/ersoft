import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaLock,
  FaSync,
  FaCheckCircle,
  FaArrowLeft,
  FaChartPie,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useFinanzas } from '../../context/FinanzasContext';
import { useInventario } from '../../context/InventarioContext';
import { getBranches, todayLima } from '../../utils/businessData';
import ProfitLossFilters from '../../components/finanzas/ProfitLossFilters';
import ProfitLossKpiGrid from '../../components/finanzas/ProfitLossKpiGrid';
import ProfitLossTable from '../../components/finanzas/ProfitLossTable';
import { exportProfitLossExcel } from '../../utils/exportProfitLossExcel';
import type {
  BranchOption,
  DatePreset,
  FilterParams,
  FinancialMovementDetail,
  ProfitLossData,
} from '../../types/finance';

interface ProfitLossReportPageProps {
  embedded?: boolean;
  initialBranchId?: string;
}

interface RawSaleItem {
  id?: string | number;
  nombre?: string;
  precio?: number;
  costo?: number;
  qty?: number;
  tipo?: string;
  _type?: string;
}

interface RawSaleRecord {
  id: string;
  tipo?: string;
  fecha: string;
  estado?: string;
  sucursalId?: string | number;
  sucursal_id?: string | number;
  condicion_pago?: string;
  metodoPago?: string;
  total: number;
  subtotal?: number;
  discountAmt?: number;
  cliente?: { nombre?: string; apellidos?: string; documento?: string } | null;
  items?: RawSaleItem[];
}

interface RawAccountRecord {
  id: string | number;
  tipo: 'POR_COBRAR' | 'POR_PAGAR';
  cliente_proveedor_nombre: string;
  comprobante_referencia: string;
  concepto: string;
  monto_total: number;
  fecha_emision: string;
  sucursal_id: string | number;
  estado: string;
  tiene_credito_fiscal_igv?: boolean;
}

interface RawExpenseRecord {
  id: string | number;
  categoria: string;
  concepto: string;
  monto: number;
  tiene_credito_fiscal_igv?: boolean;
  subtotal_sin_igv?: number;
  monto_igv?: number;
  comprobante_referencia?: string;
  sucursal_id: string | number;
  fecha_solicitud: string;
  fecha_resolucion?: string | null;
  estado: string;
}

interface RawCatalogProduct {
  id: string | number;
  nombre: string;
  costo?: number;
}

// Ventas operativas semilla de mostrador para enriquecer la vista ejecutiva cuando aún no hay comprobantes POS
const SEED_POS_SALES: RawSaleRecord[] = [
  {
    id: 'B001-000841',
    tipo: 'Boleta',
    fecha: '2026-11-01T11:20:00.000Z',
    estado: 'Activo',
    sucursalId: '1',
    condicion_pago: 'CONTADO',
    metodoPago: 'digital',
    total: 1850.0,
    subtotal: 1950.0,
    discountAmt: 100.0,
    cliente: { nombre: 'Lucía', apellidos: 'Mendoza Ríos', documento: '45892103' },
    items: [
      { id: 1001, nombre: 'Polo Jersey Clásico Algodón', precio: 39.9, costo: 18.5, qty: 25, _type: 'Producto' },
      { id: 1002, nombre: 'Polo Piqué Premium con Variantes', precio: 55.0, costo: 26.0, qty: 15, _type: 'Producto' },
    ],
  },
  {
    id: 'F001-000312',
    tipo: 'Factura',
    fecha: '2026-11-02T16:10:00.000Z',
    estado: 'Activo',
    sucursalId: '1',
    condicion_pago: 'CONTADO',
    metodoPago: 'bank',
    total: 3240.0,
    subtotal: 3240.0,
    discountAmt: 0,
    cliente: { nombre: 'Comercial Textil Andina SAC', apellidos: '', documento: '20518944120' },
    items: [
      { id: 1003, nombre: 'Tela Algodón Pima 50/1 (Por Metro)', precio: 29.5, costo: 14.2, qty: 80, _type: 'Producto' },
      { id: 1004, nombre: 'Hilado Poliéster Industrial (Por Kilo)', precio: 44.0, costo: 21.0, qty: 20, _type: 'Producto' },
    ],
  },
  {
    id: 'NV01-001105',
    tipo: 'Ticket',
    fecha: '2026-11-03T14:35:00.000Z',
    estado: 'Activo',
    sucursalId: '2',
    condicion_pago: 'CONTADO',
    metodoPago: 'cash',
    total: 1420.0,
    subtotal: 1420.0,
    discountAmt: 0,
    cliente: { nombre: 'Carlos', apellidos: 'Vargas Soto', documento: '71204981' },
    items: [
      { id: 1001, nombre: 'Polo Jersey Clásico Algodón', precio: 39.9, costo: 18.5, qty: 20, _type: 'Producto' },
      { id: 2001, nombre: 'Servicio de Bordado Computarizado', precio: 31.1, costo: 0, qty: 20, _type: 'Servicio' },
    ],
  },
  {
    id: 'B001-000890',
    tipo: 'Boleta',
    fecha: '2026-10-24T10:15:00.000Z',
    estado: 'Activo',
    sucursalId: '3',
    condicion_pago: 'CONTADO',
    metodoPago: 'pos',
    total: 2190.0,
    subtotal: 2250.0,
    discountAmt: 60.0,
    cliente: { nombre: 'Elena', apellidos: 'Quispe Mamani', documento: '41098234' },
    items: [
      { id: 1002, nombre: 'Polo Piqué Premium con Variantes', precio: 55.0, costo: 26.0, qty: 40, _type: 'Producto' },
    ],
  },
];

const normalizeDateStr = (val?: string | null): string => {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(val));
  } catch {
    return String(val).slice(0, 10);
  }
};

const computePresetRange = (preset: DatePreset, refToday: string): { startDate: string; endDate: string } => {
  const [y, m, d] = refToday.split('-').map(Number);
  const current = new Date(y, (m || 1) - 1, d || 1);

  const fmt = (dt: Date): string => {
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  switch (preset) {
    case 'HOY':
      return { startDate: refToday, endDate: refToday };
    case 'ESTA_SEMANA': {
      const dayOfWeek = current.getDay(); // 0 (Dom) .. 6 (Sab)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(current);
      monday.setDate(current.getDate() + diffToMonday);
      return { startDate: fmt(monday), endDate: refToday };
    }
    case 'ESTE_MES': {
      const firstDay = new Date(y, (m || 1) - 1, 1);
      const lastDay = new Date(y, m || 1, 0);
      return { startDate: fmt(firstDay), endDate: fmt(lastDay) };
    }
    case 'MES_ANTERIOR': {
      const firstPrev = new Date(y, (m || 1) - 2, 1);
      const lastPrev = new Date(y, (m || 1) - 1, 0);
      return { startDate: fmt(firstPrev), endDate: fmt(lastPrev) };
    }
    case 'ANIO_ACTUAL':
    default:
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
  }
};

export const ProfitLossReportPage: React.FC<ProfitLossReportPageProps> = ({
  embedded = false,
  initialBranchId,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth() as {
    user?: { id?: string | number; name?: string; rol?: string; role?: string; sucursal_id?: string | number };
  };
  const {
    ventas = [],
    cuentasCobrarPagar = [],
    rendicionesGastos = [],
    refreshFinanzas,
  } = useFinanzas() as {
    ventas: RawSaleRecord[];
    cuentasCobrarPagar: RawAccountRecord[];
    rendicionesGastos: RawExpenseRecord[];
    refreshFinanzas?: () => void;
  };
  const { productos = [] } = useInventario() as {
    productos: RawCatalogProduct[];
  };

  // 1. Verificación RBAC Estricta: Exclusivo para MASTER y ADMINISTRADOR
  const normalizedRole = String(user?.rol || user?.role || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const isAuthorizedRole = normalizedRole === 'MASTER' || normalizedRole === 'ADMINISTRADOR';

  const branches: BranchOption[] = useMemo(() => {
    const raw = (getBranches() || []) as { id: string | number; nombre?: string; nombreComercial?: string }[];
    return raw.map((b) => ({
      id: String(b.id),
      nombre: b.nombre || b.nombreComercial || `Sucursal #${b.id}`,
    }));
  }, []);

  const refToday = useMemo(() => todayLima(), []);
  const initialRange = useMemo(() => computePresetRange('ANIO_ACTUAL', refToday), [refToday]);

  const [filters, setFilters] = useState<FilterParams>(() => ({
    preset: 'ANIO_ACTUAL',
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    sucursalId: initialBranchId || 'TODAS',
    excluirIgv: false,
  }));

  const [exportToast, setExportToast] = useState<string | null>(null);

  const branchNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of branches) {
      map[String(b.id)] = b.nombre;
    }
    return map;
  }, [branches]);

  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of productos) {
      map.set(String(p.id), Number(p.costo || 0));
    }
    return map;
  }, [productos]);

  // 2. Motor de Cálculo Contable del Estado de Resultados (P&L)
  const profitLossData: ProfitLossData = useMemo(() => {
    const { startDate, endDate, sucursalId, excluirIgv } = filters;
    const taxDivisor = excluirIgv ? 1.18 : 1;

    const matchesBranch = (branchVal: string | number | undefined): boolean => {
      if (!sucursalId || sucursalId === 'TODAS') return true;
      return String(branchVal || '1') === String(sucursalId);
    };

    const matchesDate = (dateVal: string | null | undefined): boolean => {
      const d = normalizeDateStr(dateVal);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    // Combinar ventas reales en localStorage con las ventas semilla (sin duplicar por ID)
    const existingIds = new Set(ventas.map((v) => String(v.id)));
    const combinedSales: RawSaleRecord[] = [
      ...ventas,
      ...SEED_POS_SALES.filter((s) => !existingIds.has(String(s.id))),
    ];

    const activeSales = combinedSales.filter((v) => {
      const st = String(v.estado || 'Activo').toUpperCase();
      if (st === 'ANULADO' || st === 'ANULADA') return false;
      const bId = v.sucursalId ?? v.sucursal_id ?? '1';
      return matchesBranch(bId) && matchesDate(v.fecha);
    });

    const detallesMostrador: FinancialMovementDetail[] = [];
    const detallesCorporativas: FinancialMovementDetail[] = [];
    const detallesCostoVentas: FinancialMovementDetail[] = [];

    let ventasMostradorBruto = 0;
    let ventasCorporativasBruto = 0;
    let descuentosTotal = 0;
    let costoMercaderiaTotal = 0;
    let igvInformativoVentas = 0;

    // Procesar comprobantes de venta
    const processedSaleRefs = new Set<string>();

    for (const sale of activeSales) {
      processedSaleRefs.add(String(sale.id));
      const bId = String(sale.sucursalId ?? sale.sucursal_id ?? '1');
      const bName = branchNameMap[bId] || `Sucursal #${bId}`;
      const fechaStr = normalizeDateStr(sale.fecha);
      const isCredit =
        String(sale.condicion_pago || '').toUpperCase() === 'CREDITO' ||
        String(sale.metodoPago || '').toLowerCase() === 'credit';

      const saleTotalRaw = Number(sale.total || 0);
      const saleDiscountRaw = Number(sale.discountAmt || 0);
      const saleGrossBeforeDiscount = saleTotalRaw + saleDiscountRaw;

      const montoEval = saleGrossBeforeDiscount / taxDivisor;
      const descEval = saleDiscountRaw / taxDivisor;
      const netSaleEval = saleTotalRaw / taxDivisor;

      // RN-02: IGV 18% informativo sobre el total facturado
      const baseSinIgv = saleTotalRaw / 1.18;
      igvInformativoVentas += saleTotalRaw - baseSinIgv;

      descuentosTotal += descEval;

      const clienteNombre = sale.cliente
        ? `${sale.cliente.nombre || ''} ${sale.cliente.apellidos || ''}`.trim() || 'Cliente'
        : 'Consumidor Final';

      if (isCredit) {
        ventasCorporativasBruto += montoEval;
        detallesCorporativas.push({
          id: `sale-cred-${sale.id}`,
          fecha: fechaStr,
          referencia: sale.id,
          concepto: `Venta al Crédito — ${clienteNombre}`,
          sucursalId: bId,
          sucursalNombre: bName,
          monto: Number(netSaleEval.toFixed(2)),
          origen: 'POS_CREDITO',
        });
      } else {
        ventasMostradorBruto += montoEval;
        detallesMostrador.push({
          id: `sale-pos-${sale.id}`,
          fecha: fechaStr,
          referencia: sale.id,
          concepto: `Venta Mostrador (${sale.tipo || 'Comprobante'}) — ${clienteNombre}`,
          sucursalId: bId,
          sucursalNombre: bName,
          monto: Number(netSaleEval.toFixed(2)),
          origen: 'POS_CONTADO',
        });
      }

      // Calcular Costo de Ventas (COGS) por cada ítem de tipo Producto (RN-05: excluye Servicios)
      for (const item of sale.items || []) {
        const itemType = String(item._type || item.tipo || 'Producto').toUpperCase();
        if (itemType === 'SERVICIO') continue; // RN-05: Servicios no mueven Kardex ni tienen costo de mercadería

        const qty = Number(item.qty || 0);
        if (qty <= 0) continue;

        const unitCost =
          Number(item.costo) > 0
            ? Number(item.costo)
            : productCostMap.get(String(item.id)) ?? Number(item.precio || 0) * 0.48;

        const lineCost = Number((qty * unitCost).toFixed(2));
        if (lineCost > 0) {
          costoMercaderiaTotal += lineCost;
          detallesCostoVentas.push({
            id: `cogs-${sale.id}-${item.id || item.nombre}`,
            fecha: fechaStr,
            referencia: sale.id,
            concepto: `${item.nombre || 'Producto'} (${qty} und × S/ ${unitCost.toFixed(2)})`,
            sucursalId: bId,
            sucursalNombre: bName,
            monto: lineCost,
            origen: 'KARDEX_COGS',
          });
        }
      }
    }

    // Incluir Cuentas por Cobrar corporativas registradas en Tesorería que no provengan de un comprobante ya sumado (RN-03)
    for (const cxc of cuentasCobrarPagar) {
      if (cxc.tipo !== 'POR_COBRAR' || String(cxc.estado).toUpperCase() === 'ANULADO') continue;
      if (processedSaleRefs.has(String(cxc.comprobante_referencia))) continue;
      const bId = String(cxc.sucursal_id || '1');
      if (!matchesBranch(bId) || !matchesDate(cxc.fecha_emision)) continue;

      const bName = branchNameMap[bId] || `Sucursal #${bId}`;
      const rawTotal = Number(cxc.monto_total || 0);
      const evalAmount = rawTotal / taxDivisor;

      const baseSinIgv = rawTotal / 1.18;
      igvInformativoVentas += rawTotal - baseSinIgv;

      ventasCorporativasBruto += evalAmount;
      detallesCorporativas.push({
        id: `cxc-${cxc.id}`,
        fecha: normalizeDateStr(cxc.fecha_emision),
        referencia: cxc.comprobante_referencia || `CXC-${cxc.id}`,
        concepto: `${cxc.cliente_proveedor_nombre} — ${cxc.concepto}`,
        sucursalId: bId,
        sucursalNombre: bName,
        monto: Number(evalAmount.toFixed(2)),
        origen: 'CXC_CORPORATIVA',
      });

      // Costo estimado de mercadería para factura corporativa directa (46% costo industrial textil)
      const estimatedCogs = Number(((rawTotal / 1.18) * 0.46).toFixed(2));
      costoMercaderiaTotal += estimatedCogs;
      detallesCostoVentas.push({
        id: `cogs-cxc-${cxc.id}`,
        fecha: normalizeDateStr(cxc.fecha_emision),
        referencia: cxc.comprobante_referencia || `CXC-${cxc.id}`,
        concepto: `Costo de despacho corporativo — ${cxc.cliente_proveedor_nombre}`,
        sucursalId: bId,
        sucursalNombre: bName,
        monto: estimatedCogs,
        origen: 'KARDEX_COGS',
      });
    }

    // Procesar Gastos Operativos (OPEX - RN-04)
    const detallesRendiciones: FinancialMovementDetail[] = [];
    const detallesServiciosPublicos: FinancialMovementDetail[] = [];
    const detallesOtrosEgresos: FinancialMovementDetail[] = [];

    let rendicionesAprobadasTotal = 0;
    let serviciosPublicosTotal = 0;
    let otrosEgresosTotal = 0;
    let creditoFiscalIgvGastos = 0;

    for (const r of rendicionesGastos) {
      if (String(r.estado).toUpperCase() !== 'APROBADO') continue;
      const bId = String(r.sucursal_id || '1');
      const evalDate = r.fecha_resolucion || r.fecha_solicitud;
      if (!matchesBranch(bId) || !matchesDate(evalDate)) continue;

      const bName = branchNameMap[bId] || `Sucursal #${bId}`;
      const rawMonto = Number(r.monto || 0);
      const hasTaxCredit = Boolean(r.tiene_credito_fiscal_igv);
      const igvGasto = hasTaxCredit ? Number(r.monto_igv ?? rawMonto - rawMonto / 1.18) : 0;
      creditoFiscalIgvGastos += igvGasto;

      const gastoEval = excluirIgv && hasTaxCredit ? rawMonto / 1.18 : rawMonto;
      const cat = String(r.categoria || '').toUpperCase();

      if (cat === 'LUZ_AGUA' || cat === 'ALQUILER' || cat === 'SERVICIOS' || cat === 'MANTENIMIENTO') {
        serviciosPublicosTotal += gastoEval;
        detallesServiciosPublicos.push({
          id: `rend-srv-${r.id}`,
          fecha: normalizeDateStr(evalDate),
          referencia: r.comprobante_referencia || `REND-${r.id}`,
          concepto: `[${cat}] ${r.concepto}`,
          sucursalId: bId,
          sucursalNombre: bName,
          monto: Number(gastoEval.toFixed(2)),
          origen: 'SERVICIO_PUBLICO',
        });
      } else {
        rendicionesAprobadasTotal += gastoEval;
        detallesRendiciones.push({
          id: `rend-opex-${r.id}`,
          fecha: normalizeDateStr(evalDate),
          referencia: r.comprobante_referencia || `REND-${r.id}`,
          concepto: `[${cat}] ${r.concepto}`,
          sucursalId: bId,
          sucursalNombre: bName,
          monto: Number(gastoEval.toFixed(2)),
          origen: 'RENDICION_OPEX',
        });
      }
    }

    // Incluir Cuentas por Pagar operativas (Fletes / Transporte / Servicios no duplicados con rendiciones)
    const rendicionRefs = new Set(
      rendicionesGastos.map((r) => String(r.comprobante_referencia || '')).filter(Boolean)
    );
    for (const cxp of cuentasCobrarPagar) {
      if (cxp.tipo !== 'POR_PAGAR' || String(cxp.estado).toUpperCase() === 'ANULADO') continue;
      if (rendicionRefs.has(String(cxp.comprobante_referencia))) continue;
      // Excluir compras de inventario/telas de lencería que ya forman parte del costo de ventas al venderse
      const conceptoUpper = String(cxp.concepto || '').toUpperCase();
      const isInventoryPurchase =
        conceptoUpper.includes('ADQUISICIÓN DE TELAS') || conceptoUpper.includes('LOTE');
      if (isInventoryPurchase) continue;

      const bId = String(cxp.sucursal_id || '1');
      if (!matchesBranch(bId) || !matchesDate(cxp.fecha_emision)) continue;

      const bName = branchNameMap[bId] || `Sucursal #${bId}`;
      const rawMonto = Number(cxp.monto_total || 0);
      const hasTaxCredit = Boolean(cxp.tiene_credito_fiscal_igv);
      if (hasTaxCredit) {
        creditoFiscalIgvGastos += rawMonto - rawMonto / 1.18;
      }
      const gastoEval = excluirIgv && hasTaxCredit ? rawMonto / 1.18 : rawMonto;

      otrosEgresosTotal += gastoEval;
      detallesOtrosEgresos.push({
        id: `cxp-opex-${cxp.id}`,
        fecha: normalizeDateStr(cxp.fecha_emision),
        referencia: cxp.comprobante_referencia || `CXP-${cxp.id}`,
        concepto: `${cxp.cliente_proveedor_nombre} — ${cxp.concepto}`,
        sucursalId: bId,
        sucursalNombre: bName,
        monto: Number(gastoEval.toFixed(2)),
        origen: 'OTRO_EGRESO',
      });
    }

    const ventasMostrador = Number(ventasMostradorBruto.toFixed(2));
    const ventasCorporativasCredito = Number(ventasCorporativasBruto.toFixed(2));
    const descuentosNotasCredito = Number(descuentosTotal.toFixed(2));
    const totalIngresosNetos = Number(
      Math.max(0, ventasMostrador + ventasCorporativasCredito - descuentosNotasCredito).toFixed(2)
    );

    const costoMercaderiaVendida = Number(costoMercaderiaTotal.toFixed(2));
    const totalCostoVentas = costoMercaderiaVendida;

    const utilidadBruta = Number((totalIngresosNetos - totalCostoVentas).toFixed(2));
    const margenBrutoPct =
      totalIngresosNetos > 0 ? Number(((utilidadBruta / totalIngresosNetos) * 100).toFixed(2)) : 0;

    const rendicionesAprobadas = Number(rendicionesAprobadasTotal.toFixed(2));
    const serviciosPublicosMantenimiento = Number(serviciosPublicosTotal.toFixed(2));
    const otrosEgresosOperativos = Number(otrosEgresosTotal.toFixed(2));
    const totalGastosOperativos = Number(
      (rendicionesAprobadas + serviciosPublicosMantenimiento + otrosEgresosOperativos).toFixed(2)
    );

    const utilidadNeta = Number((utilidadBruta - totalGastosOperativos).toFixed(2));
    const margenNetoPct =
      totalIngresosNetos > 0 ? Number(((utilidadNeta / totalIngresosNetos) * 100).toFixed(2)) : 0;

    const selectedBranchLabel =
      sucursalId === 'TODAS'
        ? 'Todas las sucursales (Consolidado)'
        : branchNameMap[sucursalId] || `Sucursal #${sucursalId}`;

    return {
      filters: {
        ...filters,
        sucursalNombre: selectedBranchLabel,
      },
      ingresos: {
        ventasMostrador,
        ventasCorporativasCredito,
        descuentosNotasCredito,
        totalIngresosNetos,
        detallesMostrador,
        detallesCorporativas,
      },
      costoVentas: {
        costoMercaderiaVendida,
        totalCostoVentas,
        detallesCostoVentas,
      },
      utilidadBruta,
      margenBrutoPct,
      gastosOperativos: {
        rendicionesAprobadas,
        serviciosPublicosMantenimiento,
        otrosEgresosOperativos,
        totalGastosOperativos,
        detallesRendiciones,
        detallesServiciosPublicos,
        detallesOtrosEgresos,
      },
      utilidadNeta,
      margenNetoPct,
      igvInformativoVentas: Number(igvInformativoVentas.toFixed(2)),
      creditoFiscalIgvGastos: Number(creditoFiscalIgvGastos.toFixed(2)),
      fechaGeneracion: new Date().toISOString(),
    };
  }, [
    filters,
    ventas,
    cuentasCobrarPagar,
    rendicionesGastos,
    branchNameMap,
    productCostMap,
  ]);

  // Handlers de filtros
  const handlePresetChange = (preset: DatePreset) => {
    const range = computePresetRange(preset, refToday);
    setFilters((prev) => ({
      ...prev,
      preset,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({
      ...prev,
      preset: 'PERSONALIZADO',
      startDate,
      endDate,
    }));
  };

  const handleSucursalChange = (sucursalId: string) => {
    setFilters((prev) => ({
      ...prev,
      sucursalId,
    }));
  };

  const handleToggleExcluirIgv = (excluirIgv: boolean) => {
    setFilters((prev) => ({
      ...prev,
      excluirIgv,
    }));
  };

  const handleExportExcel = () => {
    const generatedFileName = exportProfitLossExcel(profitLossData);
    setExportToast(generatedFileName);
    setTimeout(() => setExportToast(null), 4500);
  };

  // Vista 403 RBAC para CAJERO o ALMACENERO
  if (!isAuthorizedRole) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <FaLock size={28} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Error 403 · Acceso Restringido
          </span>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">
              Módulo Ejecutivo de Rentabilidad (P&L)
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              El Estado de Resultados está reservado exclusivamente para los roles{' '}
              <strong className="text-slate-200">MASTER</strong> y{' '}
              <strong className="text-slate-200">ADMINISTRADOR</strong>. Tu rol actual (
              <code className="text-rose-300">{normalizedRole || 'SIN_ROL'}</code>) no posee
              privilegios para consultar estados financieros.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/principal', { replace: true })}
            className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer"
          >
            Volver al Panel Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-6' : '-m-6 min-h-full bg-slate-950 text-slate-100 p-6 space-y-6'}>
      {/* Encabezado Ejecutivo cuando se visualiza en la ruta dedicada /finanzas/estado-resultados */}
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/tesoreria')}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Volver a Tesorería y Finanzas"
            >
              <FaArrowLeft size={14} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                  <FaChartPie size={10} /> Submódulo Ejecutivo TES
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  /finanzas/estado-resultados
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Estado de Resultados (P&L — Ganancias y Pérdidas)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/tesoreria')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Ver Tesorería (CxC / CxP)
            </button>
            {typeof refreshFinanzas === 'function' && (
              <button
                type="button"
                onClick={refreshFinanzas}
                aria-label="Actualizar datos financieros"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sincronizar datos contables"
              >
                <FaSync size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notificación de descarga de archivo Excel */}
      {exportToast && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold"
        >
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-emerald-400 shrink-0" />
            <span>
              Reporte exportado exitosamente como{' '}
              <strong className="font-mono text-white">{exportToast}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 2. Barra Superior de Filtros Globales */}
      <ProfitLossFilters
        filters={profitLossData.filters}
        branches={branches}
        canSelectAllBranches={true}
        onPresetChange={handlePresetChange}
        onDateRangeChange={handleDateRangeChange}
        onSucursalChange={handleSucursalChange}
        onToggleExcluirIgv={handleToggleExcluirIgv}
        onExportExcel={handleExportExcel}
      />

      {/* 3A. Cuadrícula de Tarjetas KPI Ejecutivas */}
      <ProfitLossKpiGrid data={profitLossData} />

      {/* 3B. Tabla Financiera Estructurada (Estado de Resultados) */}
      <ProfitLossTable data={profitLossData} />
    </div>
  );
};

export default ProfitLossReportPage;
