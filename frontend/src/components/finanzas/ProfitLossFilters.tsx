import React from 'react';
import { FaFileExcel, FaCalendarAlt, FaBuilding, FaFilter } from 'react-icons/fa';
import type { BranchOption, DatePreset, FilterParams } from '../../types/finance';

interface ProfitLossFiltersProps {
  filters: FilterParams;
  branches: BranchOption[];
  canSelectAllBranches?: boolean;
  onPresetChange: (preset: DatePreset) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onSucursalChange: (sucursalId: string) => void;
  onToggleExcluirIgv: (excluirIgv: boolean) => void;
  onExportExcel: () => void;
}

const PRESET_OPTIONS: { key: DatePreset; label: string }[] = [
  { key: 'HOY', label: 'Hoy' },
  { key: 'ESTA_SEMANA', label: 'Esta Semana' },
  { key: 'ESTE_MES', label: 'Este Mes' },
  { key: 'MES_ANTERIOR', label: 'Mes Anterior' },
  { key: 'ANIO_ACTUAL', label: 'Año Actual' },
];

export const ProfitLossFilters: React.FC<ProfitLossFiltersProps> = ({
  filters,
  branches,
  canSelectAllBranches = true,
  onPresetChange,
  onDateRangeChange,
  onSucursalChange,
  onToggleExcluirIgv,
  onExportExcel,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Fila superior: Presets rápidos de fechas + Botón de Exportar a Excel */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
            <FaFilter className="text-yellow-500" /> Período:
          </span>
          {PRESET_OPTIONS.map((p) => {
            const isActive = filters.preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onPresetChange(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer"
        >
          <FaFileExcel className="text-base" />
          <span>Exportar a Excel (.xlsx)</span>
        </button>
      </div>

      {/* Fila inferior: Rango Desde / Hasta + Selector de Sucursal + Criterio IGV (RN-02) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
        {/* Fecha Desde */}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaCalendarAlt className="text-slate-500" /> Desde
          </span>
          <input
            type="date"
            aria-label="Fecha Desde"
            value={filters.startDate}
            onChange={(e) => onDateRangeChange(e.target.value, filters.endDate)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 text-xs sm:text-sm outline-none focus:border-yellow-500 transition-colors"
          />
        </label>

        {/* Fecha Hasta */}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaCalendarAlt className="text-slate-500" /> Hasta
          </span>
          <input
            type="date"
            aria-label="Fecha Hasta"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => onDateRangeChange(filters.startDate, e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 text-xs sm:text-sm outline-none focus:border-yellow-500 transition-colors"
          />
        </label>

        {/* Selector de Sucursal */}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaBuilding className="text-slate-500" /> Sucursal Evaluada
          </span>
          <select
            aria-label="Sucursal Evaluada"
            value={filters.sucursalId}
            onChange={(e) => onSucursalChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 text-xs sm:text-sm outline-none focus:border-yellow-500 transition-colors"
          >
            {canSelectAllBranches && (
              <option value="TODAS">Todas las sucursales (Consolidado)</option>
            )}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </label>

        {/* Criterio Tributario RN-02 */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors h-[38px]">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                Base sin IGV (RN-02)
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {filters.excluirIgv ? 'Excluye 18% IGV pasivo SUNAT' : 'Importes totales facturados'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(filters.excluirIgv)}
              onChange={(e) => onToggleExcluirIgv(e.target.checked)}
              className="w-4 h-4 rounded accent-yellow-500 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossFilters;
