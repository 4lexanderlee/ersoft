import * as XLSX from 'xlsx';
import type { ProfitLossData } from '../types/finance';

const sanitizeFilenameSegment = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Consolidado';

/**
 * Genera y descarga el archivo Excel (.xlsx) del Estado de Resultados (P&L)
 * con formato contable peruano (S/ #,##0.00) y fórmulas nativas de Excel.
 */
export const exportProfitLossExcel = (data: ProfitLossData): string => {
  const { filters, ingresos, costoVentas, utilidadBruta, margenBrutoPct, gastosOperativos, utilidadNeta, margenNetoPct } = data;

  const sucursalLabel = filters.sucursalNombre || (filters.sucursalId === 'TODAS' ? 'Todas las sucursales (Consolidado)' : `Sucursal_${filters.sucursalId}`);
  const sucursalSlug = filters.sucursalId === 'TODAS' ? 'Consolidado' : sanitizeFilenameSegment(sucursalLabel);
  const startSlug = filters.startDate || 'Inicio';
  const endSlug = filters.endDate || 'Fin';
  const fileName = `ERSOFT_Estado_Resultados_${sucursalSlug}_${startSlug}_${endSlug}.xlsx`;

  const emisionStr = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const totalIngresos = ingresos.totalIngresosNetos || 0;
  const pctOfIncome = (amount: number): number => (totalIngresos > 0 ? amount / totalIngresos : 0);

  // Construimos las filas de la hoja principal (1-indexed en Excel)
  // Filas 1 a 6: Encabezado institucional
  // Fila 8: Cabecera de tabla
  // Filas 9..24: Cuerpo del Estado de Resultados
  const rows: (string | number | null)[][] = [
    ['ERSOFT ERP — ESTADO DE RESULTADOS EJECUTIVO (GANANCIAS Y PÉRDIDAS / P&L)'],
    ['Sucursal Evaluada:', sucursalLabel],
    ['Rango de Fechas:', `${filters.startDate || 'Inicio'} al ${filters.endDate || 'Actualidad'}`],
    ['Criterio Contable:', filters.excluirIgv ? 'Devengado sin IGV (Base Imponible RN-02 / RN-03)' : 'Devengado Total Facturado (RN-03)'],
    ['Fecha de Emisión:', emisionStr],
    [],
    ['ESTRUCTURA DEL ESTADO DE RESULTADOS', 'MONTO (PEN)', '% SOBRE VENTAS', 'NOTAS / CRITERIO ERP'],
    // Fila 9: (+) INGRESOS OPERACIONALES
    ['(+) INGRESOS OPERACIONALES', null, null, 'Ingresos devengados en el período'],
    // Fila 10: Ventas de Mostrador / TPV
    ['    Ventas de Mostrador / TPV (Contado)', Number(ingresos.ventasMostrador.toFixed(2)), pctOfIncome(ingresos.ventasMostrador), `${ingresos.detallesMostrador.length} comprobantes TPV`],
    // Fila 11: Ventas Corporativas / Crédito
    ['    Ventas Corporativas / Crédito', Number(ingresos.ventasCorporativasCredito.toFixed(2)), pctOfIncome(ingresos.ventasCorporativasCredito), `${ingresos.detallesCorporativas.length} operaciones a crédito (RN-03)`],
    // Fila 12: Descuentos / Notas de Crédito (si existen)
    ['    (-) Descuentos y Notas de Crédito', -Number(ingresos.descuentosNotasCredito.toFixed(2)), -pctOfIncome(ingresos.descuentosNotasCredito), 'Descuentos comerciales aplicados'],
    // Fila 13: Subtotal Ingresos (Fórmula SUM(B10:B12))
    ['Subtotal Ingresos Operacionales', Number(ingresos.totalIngresosNetos.toFixed(2)), 1, 'Total Ingresos Netos'],
    [],
    // Fila 15: (-) COSTO DE VENTAS (COGS)
    ['(-) COSTO DE VENTAS (COGS)', null, null, 'Valorización al costo unitario (excluye servicios RN-05)'],
    // Fila 16: Costo de mercadería vendida
    ['    Costo de mercadería vendida (Salidas por venta)', Number(costoVentas.costoMercaderiaVendida.toFixed(2)), pctOfIncome(costoVentas.costoMercaderiaVendida), `${costoVentas.detallesCostoVentas.length} salidas valorizadas`],
    // Fila 17: Subtotal Costo de Ventas (Fórmula SUM(B16:B16))
    ['Subtotal Costo de Ventas (COGS)', Number(costoVentas.totalCostoVentas.toFixed(2)), pctOfIncome(costoVentas.totalCostoVentas), 'Total Costo Directo de Ventas'],
    [],
    // Fila 19: (=) UTILIDAD BRUTA (Fórmula B13-B17)
    ['(=) UTILIDAD BRUTA', Number(utilidadBruta.toFixed(2)), Number((margenBrutoPct / 100).toFixed(4)), `Margen Bruto: ${margenBrutoPct.toFixed(2)}%`],
    [],
    // Fila 21: (-) GASTOS OPERATIVOS (OPEX)
    ['(-) GASTOS OPERATIVOS (OPEX)', null, null, 'Egresos operativos deducibles (RN-04)'],
    // Fila 22: Rendiciones de gasto aprobadas
    ['    Rendiciones de gasto aprobadas', Number(gastosOperativos.rendicionesAprobadas.toFixed(2)), pctOfIncome(gastosOperativos.rendicionesAprobadas), `${gastosOperativos.detallesRendiciones.length} rendiciones aprobadas`],
    // Fila 23: Servicios públicos y mantenimiento
    ['    Servicios públicos, alquileres y mantenimiento', Number(gastosOperativos.serviciosPublicosMantenimiento.toFixed(2)), pctOfIncome(gastosOperativos.serviciosPublicosMantenimiento), `${gastosOperativos.detallesServiciosPublicos.length} registros de servicios/alquiler`],
    // Fila 24: Otros egresos registrados
    ['    Otros egresos operativos y fletes', Number(gastosOperativos.otrosEgresosOperativos.toFixed(2)), pctOfIncome(gastosOperativos.otrosEgresosOperativos), `${gastosOperativos.detallesOtrosEgresos.length} egresos operativos`],
    // Fila 25: Subtotal Gastos Operativos (Fórmula SUM(B22:B24))
    ['Subtotal Gastos Operativos (OPEX)', Number(gastosOperativos.totalGastosOperativos.toFixed(2)), pctOfIncome(gastosOperativos.totalGastosOperativos), 'Total OPEX del ejercicio'],
    [],
    // Fila 27: (=) UTILIDAD NETA / RESULTADO DEL EJERCICIO (Fórmula B19-B25)
    ['(=) UTILIDAD NETA / RESULTADO DEL EJERCICIO', Number(utilidadNeta.toFixed(2)), Number((margenNetoPct / 100).toFixed(4)), utilidadNeta >= 0 ? `GANANCIA NETA (${margenNetoPct.toFixed(2)}%)` : `PÉRDIDA NETA (${margenNetoPct.toFixed(2)}%)`],
    [],
    // Filas 29-31: Información Tributaria Referencial (RN-02)
    ['INFORMACIÓN TRIBUTARIA REFERENCIAL (RN-02 — PASIVO SUNAT)', null, null, null],
    ['    IGV 18% Recaudado en Ventas (Débito Fiscal)', Number(data.igvInformativoVentas.toFixed(2)), null, 'El IGV es pasivo para SUNAT, no ganancia'],
    ['    IGV 18% Crédito Fiscal en Gastos/Compras', Number(data.creditoFiscalIgvGastos.toFixed(2)), null, 'Facturas con derecho a crédito fiscal'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Inyectar fórmulas nativas de Excel en las filas clave conservando el valor precalculado (.v)
  // Fila 13 (índice 12 en base 0 -> celda B13): Subtotal Ingresos = SUM(B10:B12)
  ws['B13'] = { t: 'n', f: 'SUM(B10:B12)', v: Number(ingresos.totalIngresosNetos.toFixed(2)), z: '"S/" #,##0.00' };
  ws['C13'] = { t: 'n', f: 'IF(B13>0,B13/B13,0)', v: totalIngresos > 0 ? 1 : 0, z: '0.00%' };

  // Fila 17 (celda B17): Subtotal Costo de Ventas = SUM(B16:B16)
  ws['B17'] = { t: 'n', f: 'SUM(B16:B16)', v: Number(costoVentas.totalCostoVentas.toFixed(2)), z: '"S/" #,##0.00' };
  ws['C17'] = { t: 'n', f: 'IF(B13>0,B17/B13,0)', v: pctOfIncome(costoVentas.totalCostoVentas), z: '0.00%' };

  // Fila 19 (celda B19): (=) UTILIDAD BRUTA = B13-B17
  ws['B19'] = { t: 'n', f: 'B13-B17', v: Number(utilidadBruta.toFixed(2)), z: '"S/" #,##0.00' };
  ws['C19'] = { t: 'n', f: 'IF(B13>0,B19/B13,0)', v: Number((margenBrutoPct / 100).toFixed(4)), z: '0.00%' };

  // Fila 25 (celda B25): Subtotal Gastos Operativos = SUM(B22:B24)
  ws['B25'] = { t: 'n', f: 'SUM(B22:B24)', v: Number(gastosOperativos.totalGastosOperativos.toFixed(2)), z: '"S/" #,##0.00' };
  ws['C25'] = { t: 'n', f: 'IF(B13>0,B25/B13,0)', v: pctOfIncome(gastosOperativos.totalGastosOperativos), z: '0.00%' };

  // Fila 27 (celda B27): (=) UTILIDAD NETA = B19-B25
  ws['B27'] = { t: 'n', f: 'B19-B25', v: Number(utilidadNeta.toFixed(2)), z: '"S/" #,##0.00' };
  ws['C27'] = { t: 'n', f: 'IF(B13>0,B27/B13,0)', v: Number((margenNetoPct / 100).toFixed(4)), z: '0.00%' };

  // Aplicar formato numérico "S/" #,##0.00 a todas las celdas monetarias y 0.00% a la columna C
  const moneyRowNumbers = [10, 11, 12, 13, 16, 17, 19, 22, 23, 24, 25, 27, 30, 31];
  for (const r of moneyRowNumbers) {
    const cellB = ws[`B${r}`];
    if (cellB && typeof cellB.v === 'number') {
      cellB.z = '"S/" #,##0.00';
    }
    const cellC = ws[`C${r}`];
    if (cellC && typeof cellC.v === 'number') {
      cellC.z = '0.00%';
    }
  }

  // Configurar anchos de columna para lectura ejecutiva
  ws['!cols'] = [
    { wch: 52 }, // Columna A: Conceptos contables
    { wch: 20 }, // Columna B: Montos en S/
    { wch: 16 }, // Columna C: % sobre ventas
    { wch: 44 }, // Columna D: Notas / Criterio
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');

  // Segunda hoja: Detalle Analítico de Movimientos
  const allDetails = [
    ...ingresos.detallesMostrador,
    ...ingresos.detallesCorporativas,
    ...costoVentas.detallesCostoVentas,
    ...gastosOperativos.detallesRendiciones,
    ...gastosOperativos.detallesServiciosPublicos,
    ...gastosOperativos.detallesOtrosEgresos,
  ];

  if (allDetails.length > 0) {
    const detailRows: (string | number)[][] = [
      ['FECHA', 'REFERENCIA', 'CATEGORÍA / ORIGEN', 'SUCURSAL', 'CONCEPTO / DETALLE', 'MONTO (PEN)'],
      ...allDetails.map((d) => [
        d.fecha,
        d.referencia,
        d.origen,
        d.sucursalNombre,
        d.concepto,
        Number(d.monto.toFixed(2)),
      ]),
    ];
    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    wsDetail['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 48 },
      { wch: 18 },
    ];
    for (let i = 2; i <= allDetails.length + 1; i++) {
      const c = wsDetail[`F${i}`];
      if (c) c.z = '"S/" #,##0.00';
    }
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle Analítico');
  }

  XLSX.writeFile(wb, fileName);
  return fileName;
};
