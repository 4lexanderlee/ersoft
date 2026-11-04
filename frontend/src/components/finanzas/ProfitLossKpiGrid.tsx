import React from 'react';
import {
  FaChartLine,
  FaCoins,
  FaFileInvoiceDollar,
  FaBalanceScale,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import type { ProfitLossData } from '../../types/finance';

interface ProfitLossKpiGridProps {
  data: ProfitLossData;
}

const formatPEN = (amount: number): string =>
  `S/ ${Number(amount || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const ProfitLossKpiGrid: React.FC<ProfitLossKpiGridProps> = ({ data }) => {
  const {
    ingresos,
    costoVentas,
    utilidadBruta,
    margenBrutoPct,
    gastosOperativos,
    utilidadNeta,
    margenNetoPct,
  } = data;

  const isNetPositive = utilidadNeta >= 0;
  const isGrossPositive = utilidadBruta >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Ingresos Netos (Ventas) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1. Ingresos Netos (Ventas)
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              {formatPEN(ingresos.totalIngresosNetos)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <FaChartLine size={18} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">
            Mostrador: <strong className="text-slate-200">{formatPEN(ingresos.ventasMostrador)}</strong>
          </span>
          <span className="text-slate-400">
            Crédito: <strong className="text-slate-200">{formatPEN(ingresos.ventasCorporativasCredito)}</strong>
          </span>
        </div>
      </div>

      {/* 2. Utilidad Bruta & Margen Bruto */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              2. Utilidad Bruta & Margen Bruto
            </p>
            <h3
              className={`text-2xl font-extrabold mt-1 tracking-tight ${
                isGrossPositive ? 'text-teal-400' : 'text-rose-400'
              }`}
            >
              {formatPEN(utilidadBruta)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <FaCoins size={18} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">
            COGS: <strong className="text-slate-300">{formatPEN(costoVentas.totalCostoVentas)}</strong>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
              isGrossPositive
                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            Margen Bruto: {margenBrutoPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 3. Gastos Operativos (OPEX) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              3. Gastos Operativos (OPEX)
            </p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1 tracking-tight">
              {formatPEN(gastosOperativos.totalGastosOperativos)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <FaFileInvoiceDollar size={18} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">
            Rendiciones: <strong className="text-slate-200">{formatPEN(gastosOperativos.rendicionesAprobadas)}</strong>
          </span>
          <span className="text-slate-400">
            Servicios/Otros:{' '}
            <strong className="text-slate-200">
              {formatPEN(
                gastosOperativos.serviciosPublicosMantenimiento +
                  gastosOperativos.otrosEgresosOperativos
              )}
            </strong>
          </span>
        </div>
      </div>

      {/* 4. Utilidad Neta & Margen Neto (Color Dinámico: Verde si positivo, Rojo si pérdida) */}
      <div
        className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3 transition-colors ${
          isNetPositive
            ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
            : 'border-rose-500/50 ring-1 ring-rose-500/20'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              4. Utilidad Neta & Margen Neto
            </p>
            <h3
              className={`text-2xl font-extrabold mt-1 tracking-tight ${
                isNetPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPEN(utilidadNeta)}
            </h3>
          </div>
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isNetPositive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <FaBalanceScale size={18} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span
            className={`font-bold uppercase tracking-wider text-[11px] ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? 'Resultado Positivo' : 'Pérdida Neta del Período'}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border ${
              isNetPositive
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
            }`}
          >
            {isNetPositive ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
            Margen Neto: {margenNetoPct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossKpiGrid;
