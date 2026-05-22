import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { useDS } from '../../hooks/useDS';
import {
  FaPencilAlt, FaSave, FaTimes, FaFileInvoiceDollar
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

const DEFAULT_SUCURSALES = [
  { id: '1', nombre: 'Sede Principal' },
  { id: '2', nombre: 'Sede Norte' },
  { id: '3', nombre: 'Sede Sur' },
];

const DEFAULT_SERIES_MAP = {
  '1': {
    boleta: { serie: 'B001', correlativo: 28 },
    factura: { serie: 'F001', correlativo: 0 },
    notaCredito: { serie: 'NC01', correlativo: 0 },
    ticket: { serie: 'N001', correlativo: 0 },
  },
  '2': {
    boleta: { serie: 'B002', correlativo: 0 },
    factura: { serie: 'F002', correlativo: 0 },
    notaCredito: { serie: 'NC02', correlativo: 0 },
    ticket: { serie: 'N002', correlativo: 0 },
  },
  '3': {
    boleta: { serie: 'B003', correlativo: 0 },
    factura: { serie: 'F003', correlativo: 0 },
    notaCredito: { serie: 'NC03', correlativo: 0 },
    ticket: { serie: 'N003', correlativo: 0 },
  }
};

const SectionTitle = ({ icon: Icon, title, theme }) => (
  <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${theme === 'dark' ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
    <Icon className="text-yellow-500" />
    <h2 className="font-bold text-base uppercase tracking-wider">{title}</h2>
  </div>
);

const PasswordModal = ({ onConfirm, onCancel, theme, ds }) => {
  const [pwd, setPwd]     = useState('');
  const [error, setError] = useState('');
  const { login, user }   = useAuth();

  const handleSubmit = e => {
    e.preventDefault();
    const result = login(user.username, pwd);
    if (result.success) { onConfirm(); }
    else { setError('Contraseña incorrecta. Inténtalo nuevamente.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col gap-5 ${ds.cardBg} border`}>
        <h3 className="text-lg font-bold text-center">Confirmar Identidad</h3>
        <p className={`text-sm text-center ${ds.muted}`}>
          Ingresa tu contraseña para guardar los cambios de series y correlativos.
        </p>
        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(''); }}
            placeholder="Contraseña"
            autoFocus
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${ds.inputCls}`}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onCancel}
              className={`flex-1 py-2 rounded-xl border font-semibold transition-colors
                ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SeriesCo = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const { empresa, updateEmpresa } = useEmpresa();
  const navigate = useNavigate();

  // Load sucursales to populate dropdown
  const [sucursales] = useState(() => {
    const saved = localStorage.getItem('ersoft_sucursales');
    return saved ? JSON.parse(saved) : DEFAULT_SUCURSALES;
  });

  const [selectedSucursal, setSelectedSucursal] = useState('1');

  // Load series configurations map
  const [seriesMap, setSeriesMap] = useState(() => {
    const saved = localStorage.getItem('ersoft_sucursal_series');
    if (saved) return JSON.parse(saved);

    // Fallback: sync Sede Principal series with empresa context values if present
    const initial = { ...DEFAULT_SERIES_MAP };
    if (empresa.serieBoleta) initial['1'].boleta.serie = empresa.serieBoleta;
    if (empresa.serieFactura) initial['1'].factura.serie = empresa.serieFactura;
    return initial;
  });

  const [editing, setEditing] = useState(false);
  const [tempConfig, setTempConfig] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Initialize tempConfig when selectedSucursal or editing mode changes
  useEffect(() => {
    const current = seriesMap[selectedSucursal] || {
      boleta: { serie: `B0${selectedSucursal}`, correlativo: 0 },
      factura: { serie: `F0${selectedSucursal}`, correlativo: 0 },
      notaCredito: { serie: `NC${selectedSucursal}`, correlativo: 0 },
      ticket: { serie: `N0${selectedSucursal}`, correlativo: 0 },
    };
    setTempConfig(JSON.parse(JSON.stringify(current)));
    setErrorMsg('');
  }, [selectedSucursal, editing, seriesMap]);

  const handleFieldChange = (docType, field, val) => {
    setTempConfig(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        [field]: val
      }
    }));
    setErrorMsg('');
  };

  const validate = () => {
    // Validate length and format
    const docs = ['boleta', 'factura', 'notaCredito', 'ticket'];
    for (const doc of docs) {
      const s = tempConfig[doc].serie.trim();
      const c = tempConfig[doc].correlativo;

      if (!s) {
        setErrorMsg('Todas las series son obligatorias.');
        return false;
      }
      if (s.length < 3 || s.length > 4) {
        setErrorMsg(`La serie "${s}" debe tener entre 3 y 4 caracteres.`);
        return false;
      }
      if (c < 0 || isNaN(c)) {
        setErrorMsg('Los correlativos deben ser números mayores o iguales a 0.');
        return false;
      }
    }

    // Validate duplicate series across branches
    const currentSeries = docs.map(d => tempConfig[d].serie.trim().toUpperCase());
    
    // Check in existing seriesMap
    for (const [sucId, config] of Object.entries(seriesMap)) {
      if (sucId === selectedSucursal) continue;
      
      for (const [dType, data] of Object.entries(config)) {
        const otherSerie = data.serie?.trim().toUpperCase();
        if (otherSerie && currentSeries.includes(otherSerie)) {
          // Find matching branch name
          const branchName = sucursales.find(s => s.id === sucId)?.nombre || `Sucursal ${sucId}`;
          setErrorMsg(`La serie "${otherSerie}" ya está en uso en la sucursal "${branchName}".`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveClick = () => {
    if (!validate()) return;
    setShowPassword(true);
  };

  const handlePasswordConfirmed = () => {
    const updated = {
      ...seriesMap,
      [selectedSucursal]: tempConfig
    };
    setSeriesMap(updated);
    localStorage.setItem('ersoft_sucursal_series', JSON.stringify(updated));

    // Backward compatibility: update Empresa context if Sede Principal is edited
    if (selectedSucursal === '1') {
      updateEmpresa({
        serieFactura: tempConfig.factura.serie,
        serieBoleta: tempConfig.boleta.serie,
      });
    }

    setShowPassword(false);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const getDocLabel = (key) => {
    switch (key) {
      case 'boleta': return 'Boleta de Venta';
      case 'factura': return 'Factura';
      case 'notaCredito': return 'Nota de Crédito';
      case 'ticket': return 'Ticket de Venta (Nota de Venta)';
      default: return key;
    }
  };

  if (!tempConfig) return null;

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
        onBack={() => navigate('/principal')}
        right={
          editing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-colors
                  ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                <FaTimes /> Cancelar
              </button>
              <button
                onClick={handleSaveClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
              >
                <FaSave /> Guardar Cambios
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors
                ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'}`}
            >
              <FaPencilAlt /> Editar Series
            </button>
          )
        }
      />

      <div className="flex-1 flex flex-col gap-5 px-10 py-6 max-w-4xl mx-auto w-full pb-10 overflow-y-auto">
        
        {/* Dropdown Sucursal */}
        <div className={`rounded-2xl border p-6 ${ds.cardBg}`}>
          <label className={`text-xs uppercase tracking-wider font-semibold block mb-2 ${ds.muted}`}>
            Seleccione una Sucursal
          </label>
          <select
            value={selectedSucursal}
            onChange={e => {
              setSelectedSucursal(e.target.value);
              setEditing(false);
            }}
            disabled={editing}
            className={`w-full max-w-md px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${editing ? 'opacity-65 cursor-not-allowed' : ''}`}
          >
            {sucursales.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {/* CARD: Series y Correlativos */}
        <div className={`rounded-2xl border p-6 ${ds.cardBg}`}>
          <SectionTitle icon={FaFileInvoiceDollar} title="Ventas y Facturación" theme={theme} />
          
          {errorMsg && (
            <div className="mb-4 text-sm text-red-500 bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className={`pb-3 font-semibold ${ds.muted}`}>Documento</th>
                  <th className={`pb-3 font-semibold ${ds.muted} w-40`}>Serie</th>
                  <th className={`pb-3 font-semibold ${ds.muted} w-48`}>Correlativo Actual</th>
                </tr>
              </thead>
              <tbody>
                {['boleta', 'factura', 'notaCredito', 'ticket'].map(docKey => (
                  <tr key={docKey} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                    <td className={`py-4 font-semibold ${ds.text}`}>{getDocLabel(docKey)}</td>
                    <td className="py-4 pr-4">
                      {editing ? (
                        <input
                          type="text"
                          value={tempConfig[docKey].serie}
                          onChange={e => handleFieldChange(docKey, 'serie', e.target.value.toUpperCase())}
                          maxLength={4}
                          placeholder="Ej. F001"
                          className={`w-32 px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        />
                      ) : (
                        <span className={`inline-block px-3 py-1 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-mono font-bold rounded-lg border border-yellow-500/20`}>
                          {tempConfig[docKey].serie || '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={tempConfig[docKey].correlativo}
                          onChange={e => handleFieldChange(docKey, 'correlativo', Math.max(0, parseInt(e.target.value) || 0))}
                          className={`w-32 px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        />
                      ) : (
                        <span className={`font-mono text-sm font-semibold ${ds.text}`}>{tempConfig[docKey].correlativo}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirmed}
          onCancel={() => setShowPassword(false)}
          theme={theme}
          ds={ds}
        />
      )}
    </div>
  );
};

export default SeriesCo;
