import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { useDS } from '../hooks/useDS';
import { FaPlus, FaBoxOpen } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';


const Lotes = () => {
  const { theme } = useTheme();
  const { user, login } = useAuth();
  const { lotes, createLote, cerrarLote } = useInventario();
  const navigate = useNavigate();
  const ds = useDS();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [closingLoteId, setClosingLoteId] = useState(null);
  const [closePwd, setClosePwd] = useState('');
  const [closeError, setCloseError] = useState('');

  // Sort: active first, then by creation date (newest first)
  const sorted = [...lotes].sort((a, b) => {
    if (a.estado === 'Activo' && b.estado !== 'Activo') return -1;
    if (a.estado !== 'Activo' && b.estado === 'Activo') return 1;
    return b.id - a.id;
  });

  const handleCreate = () => {
    if (!nombre.trim()) return;
    const r = login(user.username, pwd);
    if (!r.success) { setPwdError('Contraseña incorrecta'); return; }
    createLote(nombre.trim());
    setNombre(''); setPwd(''); setPwdError(''); setShowCreateForm(false);
  };

  const handleClose = () => {
    const r = login(user.username, closePwd);
    if (!r.success) { setCloseError('Contraseña incorrecta'); return; }
    cerrarLote(closingLoteId);
    setClosingLoteId(null); setClosePwd(''); setCloseError('');
  };

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>

      {/* ── Header ── */}
      <PageHeader
        onBack={() => navigate('/inventario')}
        backLabel="Inventario"
        right={
          <Btn variant="primary" size="sm" leftIcon={<FaPlus size={11} />}
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-yellow-500! text-black! hover:bg-yellow-400!">
            Nuevo Lote
          </Btn>
        }
      />

      {/* ── Create Form ── */}
      {showCreateForm && (
        <div className="mx-6 mt-5">
          <Card>
            <h3 className={`font-bold text-base mb-4 ${ds.text}`}>Crear Nuevo Lote</h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs uppercase font-semibold ${ds.muted}`}>Nombre del Lote</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej. Lote Enero 2026"
                  className={`w-full mt-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`} />
              </div>
              <div className={`text-sm ${ds.muted}`}>
                Fecha de creación: <span className="font-semibold">{new Date().toLocaleDateString('es-PE')}</span>
              </div>
              <div>
                <label className={`text-xs uppercase font-semibold ${ds.muted}`}>Confirmar con contraseña</label>
                {pwdError && <p className="text-red-400 text-xs mt-1">{pwdError}</p>}
                <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setPwdError(''); }}
                  placeholder="Contraseña del master"
                  className={`w-full mt-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`} />
              </div>
              <div className="flex gap-3">
                <Btn variant="secondary" fullWidth onClick={() => { setShowCreateForm(false); setNombre(''); setPwd(''); }}>
                  Cancelar
                </Btn>
                <Btn variant="primary" fullWidth onClick={handleCreate}
                  className="bg-yellow-500! text-black! hover:bg-yellow-400!">
                  Crear Lote
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Lots grid ── */}
      <div className="flex-1 px-6 py-5">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<FaBoxOpen />}
            title="Sin lotes"
            message="No hay lotes creados. Crea tu primer lote con el botón Nuevo Lote."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(lote => {
              const isActive = lote.estado === 'Activo';
              return (
                <Card key={lote.id}
                  className={isActive ? (ds.isDark ? 'border-yellow-500/50 ring-1 ring-yellow-500/30' : 'border-yellow-400 ring-1 ring-yellow-300') : ''}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-base ${ds.text}`}>{lote.nombre}</h3>
                      <Badge color={isActive ? 'green' : 'gray'} dot>{lote.estado}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className={ds.muted}>Fecha inicio</span>
                      <span className={`font-semibold ${ds.text}`}>{lote.fechaCreacion}</span>
                      {lote.fechaCierre && <>
                        <span className={ds.muted}>Fecha cierre</span>
                        <span className={`font-semibold ${ds.text}`}>{lote.fechaCierre}</span>
                      </>}
                      <span className={ds.muted}>Total productos</span>
                      <span className={`font-semibold ${ds.text}`}>{lote.totalProductos}</span>
                    </div>
                    {isActive && (
                      <Btn variant="secondary" size="sm"
                        onClick={() => setClosingLoteId(lote.id)}
                        className="border-red-500/40! text-red-400! hover:bg-red-500/10!">
                        ⚠ Cerrar Lote
                      </Btn>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>



      {/* ── Close Lote Modal ── */}
      {closingLoteId && (
        <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
          <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚠</span>
              </div>
              <h3 className={`font-bold text-lg ${ds.text}`}>Cerrar Lote</h3>
              <p className={`text-sm mt-1 ${ds.muted}`}>
                Esta acción es <strong>irreversible</strong>. Una vez cerrado el lote no podrá reactivarse.
              </p>
            </div>
            {closeError && <p className="text-red-400 text-sm">{closeError}</p>}
            <input type="password" value={closePwd}
              onChange={e => { setClosePwd(e.target.value); setCloseError(''); }}
              placeholder="Ingresa tu contraseña para confirmar" autoFocus
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 ${ds.inputDarkFilled}`} />
            <div className="flex gap-3">
              <Btn variant="secondary" fullWidth onClick={() => { setClosingLoteId(null); setClosePwd(''); setCloseError(''); }}>
                Cancelar
              </Btn>
              <Btn variant="danger" fullWidth onClick={handleClose}>Confirmar Cierre</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Lotes;
