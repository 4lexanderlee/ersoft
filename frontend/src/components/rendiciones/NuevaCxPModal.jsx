import React, { useState, useMemo } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useDS } from '../../hooks/useDS';
import { useAuth } from '../../context/AuthContext';
import { useFinanzas } from '../../context/FinanzasContext';
import Card from '../ui/Card';
import Btn from '../ui/Btn';
import Input from '../ui/Input';
import { validateDocNumber, sanitizeDocNumber } from '../../utils/clientValidations';
import { loadSucursales, formatPEN, selectCls } from './rendicionesUtils';

const METODOS_PAGO = ['Transferencia BCP', 'BBVA', 'Interbank', 'Efectivo', 'Yape / Plin', 'Depósito en cuenta', 'Cheque diferido'];

const NuevaCxPModal = ({ isOpen, onClose, onSuccess, branchId = 'TODAS' }) => {
  const ds = useDS();
  const { user } = useAuth();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const { addCuenta } = useFinanzas();
  const sucursales = useMemo(() => loadSucursales(), []);

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [in30Days] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [tipoDoc, setTipoDoc] = useState('RUC');
  const [numDoc, setNumDoc] = useState('');
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [concepto, setConcepto] = useState('');
  const [sucursalId, setSucursalId] = useState(String(effectiveSucursalId ?? (branchId !== 'TODAS' ? branchId : sucursales[0]?.id || '1')));
  const [montoTotal, setMontoTotal] = useState('');
  const [tieneCreditoFiscal, setTieneCreditoFiscal] = useState(true);
  const [fechaEmision, setFechaEmision] = useState(todayStr);
  const [fechaVencimiento, setFechaVencimiento] = useState(in30Days);

  // Pago adelantado opcional
  const [conAdelanto, setConAdelanto] = useState(false);
  const [montoAdelanto, setMontoAdelanto] = useState('');
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [referenciaAbono, setReferenciaAbono] = useState('');

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!can('tesoreria_cxp', 'CREAR') || (!isGlobalScope && String(sucursalId) !== String(effectiveSucursalId))) { setErrors({ general: 'Sin permiso para crear cuentas en esta sucursal.' }); return; }
    const newErrors = {};

    // Validate doc
    const docErr = validateDocNumber(tipoDoc, numDoc);
    if (docErr) newErrors.numDoc = docErr;

    // Validate proveedor
    if (!proveedorNombre.trim()) newErrors.proveedorNombre = 'Ingrese la razón social o nombre del proveedor.';
    if (!comprobanteRef.trim()) newErrors.comprobanteRef = 'Ingrese el N° de factura o comprobante del proveedor.';
    if (!concepto.trim()) newErrors.concepto = 'Ingrese el concepto u obligación contractual.';

    const total = parseFloat(montoTotal);
    if (isNaN(total) || total <= 0) {
      newErrors.montoTotal = 'Ingrese un monto total válido mayor a 0.';
    }

    let adelanto = 0;
    if (conAdelanto) {
      adelanto = parseFloat(montoAdelanto);
      if (isNaN(adelanto) || adelanto <= 0) {
        newErrors.montoAdelanto = 'Ingrese un monto de adelanto válido (> 0).';
      } else if (adelanto > total) {
        newErrors.montoAdelanto = `El adelanto no puede exceder el monto total (${formatPEN(total)}).`;
      }
    }

    if (!fechaEmision) newErrors.fechaEmision = 'Seleccione la fecha de emisión.';
    if (!fechaVencimiento) newErrors.fechaVencimiento = 'Seleccione la fecha de vencimiento.';
    if (fechaEmision && fechaVencimiento && fechaVencimiento < fechaEmision) {
      newErrors.fechaVencimiento = 'La fecha de vencimiento no puede ser anterior a la de emisión.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const saldoPendiente = Math.max(0, parseFloat((total - adelanto).toFixed(2)));
    const estado = saldoPendiente === 0 ? 'PAGADO' : adelanto > 0 ? 'PARCIAL' : 'PENDIENTE';

    const abonos = adelanto > 0 ? [{
      id: Date.now(),
      fecha: fechaEmision,
      monto: adelanto,
      metodo_pago: metodoPago,
      referencia: referenciaAbono.trim() || 'Pago adelantado inicial',
      usuario: user?.name || user?.username || 'Usuario'
    }] : [];

    const cuentaData = {
      tipo: 'POR_PAGAR',
      cliente_proveedor_nombre: proveedorNombre.trim(),
      tipo_documento: tipoDoc,
      documento_identidad: numDoc.trim(),
      comprobante_referencia: comprobanteRef.trim(),
      concepto: concepto.trim(),
      tiene_credito_fiscal_igv: tieneCreditoFiscal,
      monto_total: total,
      monto_pagado: adelanto,
      saldo_pendiente: saldoPendiente,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      sucursal_id: String(sucursalId),
      estado,
      abonos
    };

    // 1. Guardar en FinanzasContext
    let created;
    try { created = addCuenta(cuentaData); } catch (error) { setErrors({ general: error.message }); return; }

    // Calendario deriva el vencimiento directamente de FinanzasContext.
    if (onSuccess) onSuccess(created);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <Card variant="raised" className="flex flex-col gap-4">
          {errors.general && <p role="alert" className="text-red-400">{errors.general}</p>}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className={`font-black text-lg ${ds.text}`}>
                Nueva Cuenta por Pagar (Proveedor)
              </h3>
              <p className={`text-xs ${ds.muted}`}>
                Registra una obligación pendiente con proveedor y programa su fecha de vencimiento en el calendario.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-200 transition-colors`}
            >
              ✕
            </button>
          </div>

          {/* Datos del Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Tipo Doc.</label>
              <select
                value={tipoDoc}
                onChange={(e) => {
                  setTipoDoc(e.target.value);
                  setNumDoc('');
                  setErrors(p => ({ ...p, numDoc: null }));
                }}
                className={selectCls(ds)}
              >
                <option value="RUC">RUC (11 dígitos)</option>
                <option value="DNI">DNI (8 dígitos)</option>
                <option value="CE">Carnet Extranjería (9 dígitos)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Input
                label={`Número de Documento (${tipoDoc})`}
                value={numDoc}
                onChange={(e) => {
                  setNumDoc(sanitizeDocNumber(tipoDoc, e.target.value));
                  setErrors(p => ({ ...p, numDoc: null }));
                }}
                placeholder={tipoDoc === 'RUC' ? '20600000001' : '10000001'}
                error={errors.numDoc}
                required
              />
            </div>
          </div>

          <Input
            label="Razón Social / Proveedor"
            value={proveedorNombre}
            onChange={(e) => {
              setProveedorNombre(e.target.value);
              setErrors(p => ({ ...p, proveedorNombre: null }));
            }}
            placeholder="ej. Distribuidora Textil Lima SAC"
            error={errors.proveedorNombre}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Comprobante / Factura Proveedor"
              value={comprobanteRef}
              onChange={(e) => {
                setComprobanteRef(e.target.value);
                setErrors(p => ({ ...p, comprobanteRef: null }));
              }}
              placeholder="ej. F001-0004921"
              error={errors.comprobanteRef}
              required
            />
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Sucursal de Cargo</label>
              <select
                value={sucursalId}
                disabled={!isGlobalScope}
                onChange={(e) => setSucursalId(e.target.value)}
                className={selectCls(ds)}
              >
                {sucursales.filter(s => isGlobalScope || String(s.id) === String(effectiveSucursalId)).map(s => (
                  <option key={s.id} value={String(s.id)}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Concepto u Obligación"
            value={concepto}
            onChange={(e) => {
              setConcepto(e.target.value);
              setErrors(p => ({ ...p, concepto: null }));
            }}
            placeholder="ej. Adquisición de telas e insumos confección lote verano"
            error={errors.concepto}
            required
          />

          {/* Importe y Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Monto Total (S/)"
              type="number"
              step="0.01"
              min="0"
              value={montoTotal}
              onChange={(e) => {
                setMontoTotal(e.target.value);
                setErrors(p => ({ ...p, montoTotal: null }));
              }}
              placeholder="0.00"
              error={errors.montoTotal}
              required
            />
            <Input
              label="Fecha Emisión"
              type="date"
              value={fechaEmision}
              onChange={(e) => {
                setFechaEmision(e.target.value);
                setErrors(p => ({ ...p, fechaEmision: null }));
              }}
              error={errors.fechaEmision}
              required
            />
            <Input
              label="Fecha Vencimiento"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => {
                setFechaVencimiento(e.target.value);
                setErrors(p => ({ ...p, fechaVencimiento: null }));
              }}
              error={errors.fechaVencimiento}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="creditoFiscal"
              checked={tieneCreditoFiscal}
              onChange={(e) => setTieneCreditoFiscal(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
            />
            <label htmlFor="creditoFiscal" className={`text-xs font-semibold ${ds.text} cursor-pointer`}>
              Obligación con Crédito Fiscal IGV (18% deducible)
            </label>
          </div>

          {/* Sección de Pago Adelantado */}
          <div className={`p-4 rounded-xl border ${ds.cardFlat} flex flex-col gap-3 mt-1`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={conAdelanto}
                  onChange={(e) => setConAdelanto(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
                <span className={conAdelanto ? 'text-yellow-500' : ds.text}>
                  ¿Registrar Pago / Abono Adelantado Inmediato?
                </span>
              </label>
              {conAdelanto && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Abono Inicial
                </span>
              )}
            </div>

            {conAdelanto && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Input
                  label="Monto Abonado (S/)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoAdelanto}
                  onChange={(e) => {
                    setMontoAdelanto(e.target.value);
                    setErrors(p => ({ ...p, montoAdelanto: null }));
                  }}
                  placeholder="0.00"
                  error={errors.montoAdelanto}
                />
                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className={selectCls(ds)}
                  >
                    {METODOS_PAGO.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="N° Operación / Referencia"
                  value={referenciaAbono}
                  onChange={(e) => setReferenciaAbono(e.target.value)}
                  placeholder="ej. Op. 4481023"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Btn type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancelar
            </Btn>
            <Btn type="submit" fullWidth>
              Guardar Cuenta por Pagar
            </Btn>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default NuevaCxPModal;
