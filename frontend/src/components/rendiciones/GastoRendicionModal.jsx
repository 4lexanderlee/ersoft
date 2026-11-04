import React, { useMemo, useState } from 'react';
import { useDS } from '../../hooks/useDS';
import { useAuth } from '../../context/AuthContext';
import { useFinanzas } from '../../context/FinanzasContext';
import { usePermission } from '../../hooks/usePermission';
import Card from '../ui/Card';
import Btn from '../ui/Btn';
import Input from '../ui/Input';
import {
  CATEGORIAS_GASTO, loadSucursales, desglosarIGV, formatPEN, selectCls,
} from './rendicionesUtils';

/** Formulario de solicitud de rendición de gasto operativo. Nace en PENDIENTE_APROBACION. */
const GastoRendicionModal = ({ onClose, onSaved, branchId = 'TODAS' }) => {
  const ds = useDS();
  const { user } = useAuth();
  const { can, effectiveSucursalId } = usePermission();
  const { crearRendicion } = useFinanzas();
  const sucursales = useMemo(() => loadSucursales(), []);

  const [form, setForm] = useState({
    categoria: 'ALQUILER',
    concepto: '',
    monto: '',
    tiene_credito_fiscal_igv: false,
    comprobante_referencia: '',
    sucursal_id: String(effectiveSucursalId ?? (branchId !== 'TODAS' ? branchId : sucursales[0]?.id ?? '1')),
    observaciones: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const montoNum = parseFloat(form.monto) || 0;
  const { subtotal, igv } = desglosarIGV(montoNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!can('tesoreria_gastos', 'CREAR')) { setErrors({ general: 'Tu rol no puede crear rendiciones.' }); return; }
    const errs = {};
    if (!form.concepto.trim()) errs.concepto = 'Describe el gasto.';
    if (!(montoNum > 0)) errs.monto = 'Ingresa un monto mayor a 0.';
    if (form.tiene_credito_fiscal_igv && !form.comprobante_referencia.trim()) {
      errs.comprobante_referencia = 'Indica la factura que sustenta el crédito fiscal.';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const nueva = crearRendicion({
      categoria: form.categoria,
      concepto: form.concepto.trim(),
      monto: montoNum,
      tiene_credito_fiscal_igv: form.tiene_credito_fiscal_igv,
      comprobante_referencia: form.comprobante_referencia.trim() || 'Sin comprobante',
      usuario_responsable: user?.name || 'Usuario',
      sucursal_id: form.sucursal_id,
      observaciones: form.observaciones.trim(),
    });
    onSaved?.(nueva);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-lg">
        <Card variant="raised" className="flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
          <div>
            <h3 className={`font-bold text-lg ${ds.text}`}>Nueva rendición de gasto</h3>
            <p className={`text-sm ${ds.muted}`}>Se registrará como PENDIENTE_APROBACION.</p>
          </div>

          {errors.general && <p className="text-red-400 text-sm">{errors.general}</p>}

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Categoría</label>
            <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className={selectCls(ds)}>
              {CATEGORIAS_GASTO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <Input label="Concepto" value={form.concepto} onChange={(e) => set('concepto', e.target.value)}
            placeholder="Ej. Alquiler local noviembre" error={errors.concepto} />

          <Input label="Monto total (S/)" type="number" min="0" step="0.01" value={form.monto}
            onChange={(e) => set('monto', e.target.value)} placeholder="0.00" error={errors.monto} />

          <label className={`flex items-center gap-2 text-sm cursor-pointer ${ds.text}`}>
            <input type="checkbox" checked={form.tiene_credito_fiscal_igv}
              onChange={(e) => set('tiene_credito_fiscal_igv', e.target.checked)} className="w-4 h-4 accent-yellow-500" />
            Tiene factura con crédito fiscal (IGV 18%)
          </label>

          {form.tiene_credito_fiscal_igv && (
            <div className={`grid grid-cols-2 gap-2 rounded-xl border p-3 text-center ${ds.cardFlat}`}>
              <div><p className={`text-[11px] uppercase ${ds.muted}`}>Subtotal sin IGV</p><p className={`font-bold text-sm ${ds.text}`}>{formatPEN(subtotal)}</p></div>
              <div><p className={`text-[11px] uppercase ${ds.muted}`}>IGV (crédito fiscal)</p><p className="font-bold text-sm text-amber-500">{formatPEN(igv)}</p></div>
            </div>
          )}

          <Input label="Comprobante de referencia" value={form.comprobante_referencia}
            onChange={(e) => set('comprobante_referencia', e.target.value)}
            placeholder="F001-0001234 (Proveedor SAC)" error={errors.comprobante_referencia} />

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Sucursal</label>
            <select value={form.sucursal_id} onChange={(e) => set('sucursal_id', e.target.value)}
              disabled={Boolean(effectiveSucursalId)} className={selectCls(ds)}>
              {sucursales.map((s) => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
            </select>
          </div>

          <Input as="textarea" rows={2} label="Observaciones (opcional)" value={form.observaciones}
            onChange={(e) => set('observaciones', e.target.value)} />

          <div className="flex gap-3">
            <Btn type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" fullWidth>Enviar solicitud</Btn>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default GastoRendicionModal;
