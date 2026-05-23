import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { useDS } from '../hooks/useDS';
import { FaPlus, FaBoxOpen, FaTrash } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import RefreshButton from '../components/ui/RefreshButton';


const Lotes = () => {
  const { theme } = useTheme();
  const { user, verifyPassword } = useAuth();
  const { lotes, productos, createLote, cerrarLote, deleteLote, almacenes, refreshData } = useInventario();
  const navigate = useNavigate();
  const ds = useDS();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [selectedAlmacenId, setSelectedAlmacenId] = useState('');
  const [almacenError, setAlmacenError] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [closingLoteId, setClosingLoteId] = useState(null);
  const [closePwd, setClosePwd] = useState('');
  const [closeError, setCloseError] = useState('');

  // Delete closed lot state
  const [deletingLoteId, setDeletingLoteId] = useState(null);
  const [deletePwd, setDeletePwd] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const DEFAULT_SUCURSALES = [
    { id: '1', nombre: 'Sede Principal' },
    { id: '2', nombre: 'Sede Norte' },
    { id: '3', nombre: 'Sede Sur' },
  ];
  const sucursales = (() => {
    try {
      const saved = localStorage.getItem('ersoft_sucursales');
      return saved ? JSON.parse(saved) : DEFAULT_SUCURSALES;
    } catch (_) {
      return DEFAULT_SUCURSALES;
    }
  })();
  const getBranchName = (sucId) => {
    const s = sucursales.find(x => String(x.id) === String(sucId));
    return s ? (s.nombre || s.nombreComercial) : `Sucursal ${sucId}`;
  };

  const isMaster = user?.role === 'Master';
  const userSucursalId = user?.sucursalId || '1';
  const allowedAlmacenes = almacenes.filter(w => isMaster || String(w.sucursalId) === String(userSucursalId));

  // Filter lotes visible to user (only user's sucursal if not master)
  const visibleLotes = lotes.filter(l => {
    if (isMaster) return true;
    const alm = almacenes.find(a => String(a.id) === String(l.almacenId));
    return alm && String(alm.sucursalId) === String(userSucursalId);
  });

  // Sort: active first, then by creation date (newest first)
  const sorted = [...visibleLotes].sort((a, b) => {
    if (a.estado === 'Activo' && b.estado !== 'Activo') return -1;
    if (a.estado !== 'Activo' && b.estado === 'Activo') return 1;
    return b.id - a.id;
  });

  const handleCreate = () => {
    if (!nombre.trim()) return;
    if (!selectedAlmacenId) { setAlmacenError('El almacén es obligatorio'); return; }
    if (!verifyPassword(pwd)) { setPwdError('Contraseña incorrecta'); return; }
    createLote(nombre.trim(), selectedAlmacenId);
    setNombre(''); setSelectedAlmacenId(''); setPwd(''); setPwdError(''); setAlmacenError(''); setShowCreateForm(false);
  };

  const handleClose = () => {
    if (!verifyPassword(closePwd)) { setCloseError('Contraseña incorrecta'); return; }
    cerrarLote(closingLoteId);
    setClosingLoteId(null); setClosePwd(''); setCloseError('');
  };

  const handleDelete = () => {
    if (!verifyPassword(deletePwd)) { setDeleteError('Contraseña incorrecta'); return; }
    deleteLote(deletingLoteId);
    setDeletingLoteId(null); setDeletePwd(''); setDeleteError('');
  };

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>

      {/* ── Header ── */}
      <PageHeader
        onBack={() => navigate('/inventario')}
        backLabel="Inventario"
        right={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={refreshData} />
            <Btn variant="primary" size="sm" leftIcon={<FaPlus size={11} />}
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-yellow-500! text-black! hover:bg-yellow-400!">
              Nuevo Lote
            </Btn>
          </div>
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
              <div>
                <label className={`text-xs uppercase font-semibold ${ds.muted}`}>Seleccionar Almacén</label>
                {almacenError && <p className="text-red-400 text-xs mt-1">{almacenError}</p>}
                <select
                  value={selectedAlmacenId}
                  onChange={e => { setSelectedAlmacenId(e.target.value); setAlmacenError(''); }}
                  className={`w-full mt-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                >
                  <option value="">-- Selecciona un Almacén --</option>
                  {allowedAlmacenes.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.nombre} {isMaster ? `(${getBranchName(w.sucursalId)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`text-sm ${ds.muted}`}>
                Fecha de creación: <span className="font-semibold">{new Date().toLocaleDateString('es-PE')}</span>
              </div>
              <div>
                <label className={`text-xs uppercase font-semibold ${ds.muted}`}>Confirmar con contraseña</label>
                {pwdError && <p className="text-red-400 text-xs mt-1">{pwdError}</p>}
                <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setPwdError(''); }}
                  placeholder={user.role === 'Master' ? 'Contraseña del master' : 'Tu contraseña'}
                  className={`w-full mt-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`} />
              </div>
              <div className="flex gap-3">
                <Btn variant="secondary" fullWidth onClick={() => { setShowCreateForm(false); setNombre(''); setSelectedAlmacenId(''); setPwd(''); setAlmacenError(''); setPwdError(''); }}>
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
              const almacen = almacenes.find(w => w.id === lote.almacenId);
              const almacenNombre = almacen ? almacen.nombre : `Almacén ${lote.almacenId || 'N/A'}`;
              return (
                <Card key={lote.id}
                  className={isActive ? (ds.isDark ? 'border-yellow-500/50 ring-1 ring-yellow-500/30' : 'border-yellow-400 ring-1 ring-yellow-300') : ''}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-base ${ds.text}`}>{lote.nombre}</h3>
                    <div className="flex items-center gap-2">
                      <Badge color={isActive ? 'green' : 'gray'} dot>{lote.estado}</Badge>
                      {/* Trash mini-icon — ONLY on closed lots */}
                      {!isActive && (
                        <button
                          onClick={() => setDeletingLoteId(lote.id)}
                          title="Eliminar lote cerrado"
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className={ds.muted}>Almacén</span>
                      <span className={`font-semibold ${ds.text}`}>{almacenNombre}</span>
                      <span className={ds.muted}>Fecha inicio</span>
                      <span className={`font-semibold ${ds.text}`}>{lote.fechaCreacion}</span>
                      {lote.fechaCierre && <>
                        <span className={ds.muted}>Fecha cierre</span>
                        <span className={`font-semibold ${ds.text}`}>{lote.fechaCierre}</span>
                      </>}
                      <span className={ds.muted}>Total productos</span>
                      <span className={`font-semibold ${ds.text}`}>{productos.filter(p => p.loteId === lote.id).length}</span>
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
              placeholder={user.role === 'Master' ? 'Contraseña del master' : 'Tu contraseña'} autoFocus
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

      {/* ── Delete Lote Modal ── */}
      {deletingLoteId && (() => {
        const productsInLote = productos.filter(p => p.loteId === deletingLoteId);
        const stockCount = productsInLote.filter(p => p.stock > 0).length;
        const hasStock = stockCount > 0;
        return (
          <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
            <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <FaTrash size={20} className="text-red-400" />
                </div>
                <h3 className={`font-bold text-lg ${ds.text}`}>Eliminar Lote</h3>
                {hasStock ? (
                  <p className="text-sm mt-1 font-semibold text-red-500">
                    ⚠ Atención: Este lote contiene {stockCount} producto(s) con stock mayor a 0. Al eliminarlo, los productos se borrarán del inventario de forma irreversible.
                  </p>
                ) : (
                  <p className={`text-sm mt-1 ${ds.muted}`}>
                    ¿Estás seguro de eliminar este lote cerrado? Esta acción <strong>no se puede deshacer</strong>.
                  </p>
                )}
              </div>
              {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
              <input type="password" value={deletePwd}
                onChange={e => { setDeletePwd(e.target.value); setDeleteError(''); }}
                placeholder={user.role === 'Master' ? 'Contraseña del master' : 'Tu contraseña'} autoFocus
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 ${ds.inputDarkFilled}`} />
              <div className="flex gap-3">
                <Btn variant="secondary" fullWidth onClick={() => { setDeletingLoteId(null); setDeletePwd(''); setDeleteError(''); }}>
                  Cancelar
                </Btn>
                <Btn variant="danger" fullWidth onClick={handleDelete}>Eliminar</Btn>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};

export default Lotes;
