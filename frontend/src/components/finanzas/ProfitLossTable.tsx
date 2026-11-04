import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import type { FinancialMovementDetail, ProfitLossData } from '../../types/finance';

interface ProfitLossTableProps {
  data: ProfitLossData;
}

const formatPEN = (amount: number, isNegativeDisplay = false): string => {
  const val = Number(amount || 0);
  const formatted = Math.abs(val).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (val < 0 || (isNegativeDisplay && val > 0)) {
    return `(S/ ${formatted})`;
  }
  return `S/ ${formatted}`;
};

export const ProfitLossTable: React.FC<ProfitLossTableProps> = ({ data }) => {
  const {
    ingresos,
    costoVentas,
    utilidadBruta,
    margenBrutoPct,
    gastosOperativos,
    utilidadNeta,
    margenNetoPct,
    igvInformativoVentas,
    creditoFiscalIgvGastos,
  } = data;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ingresos: true,
    cogs: true,
    opex: true,
  });

  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleDetail = (key: string) =>
    setExpandedDetails((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalIncome = ingresos.totalIngresosNetos || 0;
  const pct = (val: number): string =>
    totalIncome > 0 ? `${((val / totalIncome) * 100).toFixed(1)}%` : '0.0%';

  const isNetPositive = utilidadNeta >= 0;
  const isGrossPositive = utilidadBruta >= 0;

  const renderDetailDrawer = (key: string, items: FinancialMovementDetail[]) => {
    if (!expandedDetails[key]) return null;
    if (items.length === 0) {
      return (
        <tr className="bg-slate-950/70 border-b border-slate-800/60">
          <td colSpan={4} className="px-10 py-2.5 text-xs italic text-slate-500">
            No se registraron movimientos individuales en este rubro para el rango seleccionado.
          </td>
        </tr>
      );
    }
    return (
      <tr className="bg-slate-950/80 border-b border-slate-800/80">
        <td colSpan={4} className="px-6 sm:px-10 py-3">
          <div className="rounded-xl border border-slate-800 overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-left font-bold">Fecha</th>
                  <th className="py-2 px-3 text-left font-bold">Referencia</th>
                  <th className="py-2 px-3 text-left font-bold">Sucursal</th>
                  <th className="py-2 px-3 text-left font-bold">Concepto / Detalle</th>
                  <th className="py-2 px-3 text-right font-bold">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 text-slate-300">
                    <td className="py-1.5 px-3 whitespace-nowrap font-mono text-[11px]">{item.fecha}</td>
                    <td className="py-1.5 px-3 whitespace-nowrap font-semibold text-yellow-400/90">
                      {item.referencia}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap text-slate-400">{item.sucursalNombre}</td>
                    <td className="py-1.5 px-3">{item.concepto}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-semibold">
                      {formatPEN(item.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Cabecera de la Tabla Contable */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Estado de Resultados Integrado (P&L)
          </h2>
          <p className="text-xs text-slate-400">
            Haz clic en cada sección o partida contable para expandir el desglose analítico de comprobantes.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-lg">
          Moneda Funcional: Soles (PEN - S/)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider">
              <th className="py-3.5 px-6 text-left font-bold w-[52%]">Partida / Rubro Contable</th>
              <th className="py-3.5 px-4 text-center font-bold w-[16%]">Operaciones</th>
              <th className="py-3.5 px-4 text-right font-bold w-[14%]">% Vertical</th>
              <th className="py-3.5 px-6 text-right font-bold w-[18%]">Importe (PEN)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/70 text-slate-200">
            {/* ════════════════════════════════════════════════════════════════
                1. (+) INGRESOS OPERACIONALES
               ════════════════════════════════════════════════════════════════ */}
            <tr
              onClick={() => toggleSection('ingresos')}
              className="bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer transition-colors"
            >
              <td className="py-3.5 px-6 font-extrabold text-sky-400 flex items-center gap-2.5">
                {expandedSections.ingresos ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                <span>(+) INGRESOS OPERACIONALES</span>
              </td>
              <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                {ingresos.detallesMostrador.length + ingresos.detallesCorporativas.length} docs
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">100.0%</td>
              <td className="py-3.5 px-6 text-right font-mono font-extrabold text-sky-400">
                {formatPEN(ingresos.totalIngresosNetos)}
              </td>
            </tr>

            {expandedSections.ingresos && (
              <>
                {/* Sub-fila 1.1: Ventas de Mostrador / TPV */}
                <tr
                  onClick={() => toggleDetail('mostrador')}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-11 pr-6 text-slate-300 flex items-center gap-2">
                    {expandedDetails.mostrador ? (
                      <FaChevronDown size={10} className="text-slate-500" />
                    ) : (
                      <FaChevronRight size={10} className="text-slate-500" />
                    )}
                    <span>Ventas de Mostrador / TPV</span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">
                    {ingresos.detallesMostrador.length} tickets/boletas
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {pct(ingresos.ventasMostrador)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-slate-200">
                    {formatPEN(ingresos.ventasMostrador)}
                  </td>
                </tr>
                {renderDetailDrawer('mostrador', ingresos.detallesMostrador)}

                {/* Sub-fila 1.2: Ventas Corporativas / Crédito */}
                <tr
                  onClick={() => toggleDetail('corporativas')}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-11 pr-6 text-slate-300 flex items-center gap-2">
                    {expandedDetails.corporativas ? (
                      <FaChevronDown size={10} className="text-slate-500" />
                    ) : (
                      <FaChevronRight size={10} className="text-slate-500" />
                    )}
                    <span>Ventas Corporativas / Crédito (Devengo RN-03)</span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">
                    {ingresos.detallesCorporativas.length} facturas/créditos
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {pct(ingresos.ventasCorporativasCredito)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-slate-200">
                    {formatPEN(ingresos.ventasCorporativasCredito)}
                  </td>
                </tr>
                {renderDetailDrawer('corporativas', ingresos.detallesCorporativas)}

                {/* Sub-fila 1.3: Descuentos / Notas de Crédito (si > 0) */}
                {ingresos.descuentosNotasCredito > 0 && (
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 pl-14 pr-6 text-rose-300/90 text-xs italic">
                      (-) Descuentos comerciales y Notas de Crédito aplicadas
                    </td>
                    <td className="py-2.5 px-4 text-center text-xs text-slate-500">—</td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs text-rose-400">
                      -{pct(ingresos.descuentosNotasCredito)}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-rose-400">
                      {formatPEN(ingresos.descuentosNotasCredito, true)}
                    </td>
                  </tr>
                )}

                {/* Subtotal Ingresos */}
                <tr className="bg-slate-950/40 font-bold border-t border-slate-800">
                  <td className="py-3 pl-11 pr-6 text-slate-200 italic">Subtotal Ingresos</td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">Consolidado</td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-300">
                    {totalIncome > 0 ? '100.0%' : '0.0%'}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-white">
                    {formatPEN(ingresos.totalIngresosNetos)}
                  </td>
                </tr>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                2. (-) COSTO DE VENTAS (COGS)
               ════════════════════════════════════════════════════════════════ */}
            <tr
              onClick={() => toggleSection('cogs')}
              className="bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer transition-colors"
            >
              <td className="py-3.5 px-6 font-extrabold text-amber-300 flex items-center gap-2.5">
                {expandedSections.cogs ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                <span>(-) COSTO DE VENTAS (COGS)</span>
              </td>
              <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                {costoVentas.detallesCostoVentas.length} salidas
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">
                {pct(costoVentas.totalCostoVentas)}
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-extrabold text-amber-300">
                {formatPEN(costoVentas.totalCostoVentas, true)}
              </td>
            </tr>

            {expandedSections.cogs && (
              <>
                <tr
                  onClick={() => toggleDetail('cogs_mercaderia')}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-11 pr-6 text-slate-300 flex items-center gap-2">
                    {expandedDetails.cogs_mercaderia ? (
                      <FaChevronDown size={10} className="text-slate-500" />
                    ) : (
                      <FaChevronRight size={10} className="text-slate-500" />
                    )}
                    <span>
                      Costo de mercadería vendida (salidas de inventario por venta valorizadas al costo)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">
                    {costoVentas.detallesCostoVentas.length} ítems
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {pct(costoVentas.costoMercaderiaVendida)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-slate-200">
                    {formatPEN(costoVentas.costoMercaderiaVendida, true)}
                  </td>
                </tr>
                {renderDetailDrawer('cogs_mercaderia', costoVentas.detallesCostoVentas)}

                {/* Subtotal Costo de Ventas */}
                <tr className="bg-slate-950/40 font-bold border-t border-slate-800">
                  <td className="py-3 pl-11 pr-6 text-slate-200 italic">Subtotal Costo de Ventas</td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">Excluye Servicios (RN-05)</td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-300">
                    {pct(costoVentas.totalCostoVentas)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-amber-200">
                    {formatPEN(costoVentas.totalCostoVentas, true)}
                  </td>
                </tr>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                3. (=) UTILIDAD BRUTA (Fila destacada con badge de margen %)
               ════════════════════════════════════════════════════════════════ */}
            <tr className="bg-teal-950/40 border-y-2 border-teal-500/40">
              <td className="py-4 px-6 font-black text-base text-white flex items-center gap-3 flex-wrap">
                <span>(=) UTILIDAD BRUTA</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                    isGrossPositive
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  Margen Bruto: {margenBrutoPct.toFixed(2)}%
                </span>
              </td>
              <td className="py-4 px-4 text-center text-xs text-teal-300/80 font-semibold">
                Ingresos − COGS
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold text-teal-300">
                {margenBrutoPct.toFixed(2)}%
              </td>
              <td
                className={`py-4 px-6 text-right font-mono font-black text-base ${
                  isGrossPositive ? 'text-teal-300' : 'text-rose-400'
                }`}
              >
                {formatPEN(utilidadBruta)}
              </td>
            </tr>

            {/* ════════════════════════════════════════════════════════════════
                4. (-) GASTOS OPERATIVOS (OPEX)
               ════════════════════════════════════════════════════════════════ */}
            <tr
              onClick={() => toggleSection('opex')}
              className="bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer transition-colors"
            >
              <td className="py-3.5 px-6 font-extrabold text-orange-400 flex items-center gap-2.5">
                {expandedSections.opex ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                <span>(-) GASTOS OPERATIVOS (OPEX)</span>
              </td>
              <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                {gastosOperativos.detallesRendiciones.length +
                  gastosOperativos.detallesServiciosPublicos.length +
                  gastosOperativos.detallesOtrosEgresos.length}{' '}
                egresos
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">
                {pct(gastosOperativos.totalGastosOperativos)}
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-extrabold text-orange-400">
                {formatPEN(gastosOperativos.totalGastosOperativos, true)}
              </td>
            </tr>

            {expandedSections.opex && (
              <>
                {/* 4.1 Rendiciones de gasto aprobadas */}
                <tr
                  onClick={() => toggleDetail('opex_rendiciones')}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-11 pr-6 text-slate-300 flex items-center gap-2">
                    {expandedDetails.opex_rendiciones ? (
                      <FaChevronDown size={10} className="text-slate-500" />
                    ) : (
                      <FaChevronRight size={10} className="text-slate-500" />
                    )}
                    <span>Rendiciones de gasto aprobadas (RN-04)</span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">
                    {gastosOperativos.detallesRendiciones.length} rendiciones
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {pct(gastosOperativos.rendicionesAprobadas)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-slate-200">
                    {formatPEN(gastosOperativos.rendicionesAprobadas, true)}
                  </td>
                </tr>
                {renderDetailDrawer('opex_rendiciones', gastosOperativos.detallesRendiciones)}

                {/* 4.2 Servicios públicos y mantenimiento */}
                <tr
                  onClick={() => toggleDetail('opex_servicios')}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-11 pr-6 text-slate-300 flex items-center gap-2">
                    {expandedDetails.opex_servicios ? (
                      <FaChevronDown size={10} className="text-slate-500" />
                    ) : (
                      <FaChevronRight size={10} className="text-slate-500" />
                    )}
                    <span>Servicios públicos y mantenimiento (Luz, Agua, Alquileres)</span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">
                    {gastosOperativos.detallesServiciosPublicos.length} registros
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {pct(gastosOperativos.serviciosPublicosMantenimiento)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-slate-200">
                    {formatPEN(gastosOperativos.serviciosPublicosMantenimiento, true)}
                  </td>
                </tr>
                {renderDetailDrawer('opex_servicios', gastosOperativos.detallesServiciosPublicos)}

                {/* 4.3 Otros egresos registrados */}
                <tr
                  onClick={() => toggleDetail('opex_otros')}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 pl-11 pr-6 text-slate-300 flex items-center gap-2">
                    {expandedDetails.opex_otros ? (
                      <FaChevronDown size={10} className="text-slate-500" />
                    ) : (
                      <FaChevronRight size={10} className="text-slate-500" />
                    )}
                    <span>Otros egresos registrados (Fletes, logística e insumos tienda)</span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">
                    {gastosOperativos.detallesOtrosEgresos.length} registros
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {pct(gastosOperativos.otrosEgresosOperativos)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-slate-200">
                    {formatPEN(gastosOperativos.otrosEgresosOperativos, true)}
                  </td>
                </tr>
                {renderDetailDrawer('opex_otros', gastosOperativos.detallesOtrosEgresos)}

                {/* Subtotal Gastos Operativos */}
                <tr className="bg-slate-950/40 font-bold border-t border-slate-800">
                  <td className="py-3 pl-11 pr-6 text-slate-200 italic">Subtotal Gastos Operativos</td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400">Total OPEX</td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-300">
                    {pct(gastosOperativos.totalGastosOperativos)}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-orange-300">
                    {formatPEN(gastosOperativos.totalGastosOperativos, true)}
                  </td>
                </tr>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════
                5. (=) UTILIDAD NETA / RESULTADO DEL EJERCICIO
               ════════════════════════════════════════════════════════════════ */}
            <tr
              className={`border-t-2 ${
                isNetPositive
                  ? 'bg-emerald-950/50 border-emerald-500/60'
                  : 'bg-rose-950/50 border-rose-500/60'
              }`}
            >
              <td className="py-5 px-6 font-black text-base sm:text-lg text-white flex items-center gap-3 flex-wrap">
                <span>(=) UTILIDAD NETA / RESULTADO DEL EJERCICIO</span>
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                    isNetPositive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isNetPositive ? 'Rentabilidad Neta' : 'Pérdida Neta'}: {margenNetoPct.toFixed(2)}%
                </span>
              </td>
              <td className="py-5 px-4 text-center text-xs font-bold text-slate-300">
                Utilidad Bruta − OPEX
              </td>
              <td
                className={`py-5 px-4 text-right font-mono font-extrabold text-sm ${
                  isNetPositive ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {margenNetoPct.toFixed(2)}%
              </td>
              <td
                className={`py-5 px-6 text-right font-mono font-black text-lg sm:text-xl ${
                  isNetPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPEN(utilidadNeta)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pie informativo RN-01 / RN-02 / RN-03 */}
      <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FaInfoCircle className="text-yellow-500 shrink-0" />
          <span>
            <strong>Nota Contable (RN-01 / RN-02):</strong> El Balance Inicial de Apertura nunca se computa como ingreso operativo. El IGV 18% es pasivo tributario SUNAT.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
          <span>
            Débito Fiscal IGV Ventas: <strong className="text-slate-200">{formatPEN(igvInformativoVentas)}</strong>
          </span>
          <span>
            Crédito Fiscal IGV Gastos: <strong className="text-emerald-400">{formatPEN(creditoFiscalIgvGastos)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossTable;
