import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDS } from '../hooks/useDS';
import { useFinanzas } from '../context/FinanzasContext';
import { usePermission } from '../hooks/usePermission';
import PageHeader from '../components/ui/PageHeader';
import RefreshButton from '../components/ui/RefreshButton';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import CxCPanel from '../components/rendiciones/CxCPanel';
import CxPPanel from '../components/rendiciones/CxPPanel';
import RendicionesGastoPanel from '../components/rendiciones/RendicionesGastoPanel';
import BalanceInicialCard from '../components/rendiciones/BalanceInicialCard';
import { MODULO_RBAC, formatPEN } from '../components/rendiciones/rendicionesUtils';

const TABS = [
  { key: 'cxc', label: 'Cuentas por Cobrar (CxC)' },
  { key: 'cxp', label: 'Cuentas por Pagar (CxP)' },
  { key: 'gastos', label: 'Rendiciones de Gasto' },
  { key: 'balance', label: 'Balance Inicial' },
];

const Kpi = ({ label, value, hint, tone }) => {
  const ds = useDS();
  return (
    <Card className="flex flex-col gap-1">
      <p className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>{label}</p>
      <p className={`text-2xl font-extrabold ${tone || ds.text}`}>{value}</p>
      {hint && <p className={`text-xs ${ds.subtle}`}>{hint}</p>}
    </Card>
  );
};

const Rendiciones = () => {
  const ds = useDS();
  const navigate = useNavigate();
  const { can, effectiveSucursalId } = usePermission();
  const { calcularResumenFinanzas, rendicionesGastos, refreshFinanzas } = useFinanzas();
  const [activeTab, setActiveTab] = useState('cxc');

  if (!can(MODULO_RBAC, 'VER')) {
    return (
      <div className={`flex flex-col flex-1 -m-6 ${ds.pageBg}`}>
        <PageHeader onBack={() => navigate('/principal')} />
        <EmptyState title="Sin acceso" message="Tu rol no tiene permiso para ver Rendiciones." />
      </div>
    );
  }

  const resumen = calcularResumenFinanzas(effectiveSucursalId);
  const pendientes = rendicionesGastos.filter((r) =>
    r.estado === 'PENDIENTE_APROBACION' && (!effectiveSucursalId || String(r.sucursal_id) === String(effectiveSucursalId)));
  const montoPendiente = pendientes.reduce((s, r) => s + r.monto, 0);

  return (
    <div className={`flex flex-col flex-1 -m-6 relative overflow-hidden ${ds.pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} right={<RefreshButton onRefresh={refreshFinanzas} />} />

      <div className="flex-1 overflow-y-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 pb-2">
          <Kpi label="Total por cobrar" value={formatPEN(resumen.totalPorCobrar)} tone="text-green-500" hint="Saldo pendiente de clientes" />
          <Kpi label="Total por pagar" value={formatPEN(resumen.totalPorPagar)} tone="text-red-400" hint="Saldo pendiente a proveedores" />
          <Kpi label="Rendiciones pendientes" value={String(pendientes.length)} hint={`${formatPEN(montoPendiente)} por aprobar`} />
          <Kpi label="Patrimonio base" value={formatPEN(resumen.totalPatrimonioInicial)} hint="Balance inicial (no es venta · RN-01)" />
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#1a1a1a] mt-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === t.key ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'cxc' && <CxCPanel />}
          {activeTab === 'cxp' && <CxPPanel />}
          {activeTab === 'gastos' && <RendicionesGastoPanel />}
          {activeTab === 'balance' && <BalanceInicialCard />}
        </div>
      </div>
    </div>
  );
};

export default Rendiciones;
