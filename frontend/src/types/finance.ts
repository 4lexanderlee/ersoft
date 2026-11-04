export type DatePreset =
  | 'HOY'
  | 'ESTA_SEMANA'
  | 'ESTE_MES'
  | 'MES_ANTERIOR'
  | 'ANIO_ACTUAL'
  | 'PERSONALIZADO';

export interface FilterParams {
  preset: DatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  sucursalId: string; // 'TODAS' | '1' | '2' | '3' ...
  sucursalNombre?: string;
  excluirIgv?: boolean; // RN-02: permite evaluar Base Imponible (sin IGV 18%) o Total Facturado
}

export interface FinancialMovementDetail {
  id: string;
  fecha: string;
  referencia: string;
  concepto: string;
  sucursalId: string;
  sucursalNombre: string;
  monto: number;
  origen: 'POS_CONTADO' | 'POS_CREDITO' | 'CXC_CORPORATIVA' | 'KARDEX_COGS' | 'RENDICION_OPEX' | 'SERVICIO_PUBLICO' | 'OTRO_EGRESO';
}

export interface IncomeBreakdown {
  ventasMostrador: number;          // Ventas de Mostrador / TPV (Contado)
  ventasCorporativasCredito: number; // Ventas Corporativas / Crédito (Devengadas RN-03)
  descuentosNotasCredito: number;   // Descuentos / Notas de Crédito aplicadas
  totalIngresosNetos: number;       // Subtotal Ingresos Operacionales
  detallesMostrador: FinancialMovementDetail[];
  detallesCorporativas: FinancialMovementDetail[];
}

export interface CogsBreakdown {
  costoMercaderiaVendida: number;   // Salidas de inventario por venta valorizadas al costo (RN-05: excluye servicios)
  totalCostoVentas: number;         // Subtotal Costo de Ventas (COGS)
  detallesCostoVentas: FinancialMovementDetail[];
}

export interface ExpenseBreakdown {
  rendicionesAprobadas: number;     // Rendiciones de gasto aprobadas (RN-04)
  serviciosPublicosMantenimiento: number; // Luz, agua, alquileres, mantenimiento
  otrosEgresosOperativos: number;   // Otros egresos registrados / fletes / insumos operativos
  totalGastosOperativos: number;    // Subtotal Gastos Operativos (OPEX)
  detallesRendiciones: FinancialMovementDetail[];
  detallesServiciosPublicos: FinancialMovementDetail[];
  detallesOtrosEgresos: FinancialMovementDetail[];
}

export interface ProfitLossData {
  filters: FilterParams;
  ingresos: IncomeBreakdown;
  costoVentas: CogsBreakdown;
  utilidadBruta: number;            // Ingresos Netos - Costo de Ventas (COGS)
  margenBrutoPct: number;           // (Utilidad Bruta / Ingresos Netos) * 100
  gastosOperativos: ExpenseBreakdown;
  utilidadNeta: number;             // Utilidad Bruta - Gastos Operativos (OPEX)
  margenNetoPct: number;            // (Utilidad Neta / Ingresos Netos) * 100
  igvInformativoVentas: number;     // RN-02: IGV 18% recaudado (pasivo SUNAT, no ganancia)
  creditoFiscalIgvGastos: number;   // RN-02: IGV 18% de compras/gastos con factura
  fechaGeneracion: string;
}

export interface BranchOption {
  id: string;
  nombre: string;
}
