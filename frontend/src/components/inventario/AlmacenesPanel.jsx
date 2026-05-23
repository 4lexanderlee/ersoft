import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { useTheme } from '../../context/ThemeContext';
import { useDS } from '../../hooks/useDS';
import { FaTimes, FaWarehouse, FaTrash, FaPlus, FaCalendarAlt, FaBuilding, FaLock } from 'react-icons/fa';
import Btn from '../ui/Btn';
import Card from '../ui/Card';

const DEFAULT_SUCURSALES = [
  { id: '1', nombre: 'Sede Principal' },
  { id: '2', nombre: 'Sede Norte' },
  { id: '3', nombre: 'Sede Sur' },
];

const AlmacenesPanel = ({ onClose }) => {
  const { theme } = useTheme();
  const ds = useDS();
  const { user, login } = useAuth();
  const { almacenes, addAlmacen, deleteAlmacen, lotes } = useInventario();

  const isMaster = user?.role === 'Master';
  const userSucursalId = user?.sucursalId || '1';

  // Load branches
  const sucursales = (() => {
    try {
      const saved = localStorage.getItem('ersoft_sucursales');
      return saved ? JSON.parse(saved) : DEFAULT_SUCURSALES;
    } catch (_) {
      return DEFAULT_SUCURSALES;
    }
  })();

  // State
  const [selectedSucursal, setSelectedSucursal] = useState(isMaster ? 'Todos' : userSucursalId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [createSucursalId, setCreateSucursalId] = useState(userSucursalId);
  
  // Deletion States
  const [deletingId, setDeletingId] = useState(null);
  const [deletePwd, setDeletePwd] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Filter warehouses based on user authorization and selection
  const filteredAlmacenes = almacenes.filter(w => {
    if (!isMaster) {
      return w.sucursalId === userSucursalId;
    }
    if (selectedSucursal === 'Todos') return true;
    return w.sucursalId === selectedSucursal;
  });

  const getBranchName = (sucId) => {
    const s = sucursales.find(x => String(x.id) === String(sucId));
    return s ? (s.nombre || s.nombreComercial) : `Sucursal ${sucId}`;
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    addAlmacen(nombre.trim(), createSucursalId);
    setNombre('');
    setShowAddForm(false);
  };

  const handleDeleteConfirm = (e) => {
    e.preventDefault();
    const result = login(user.username, deletePwd);
    if (!result.success) {
      setDeleteError('Contraseña incorrecta');
      return;
    }

    deleteAlmacen(deletingId);
    setDeletingId(null);
    setDeletePwd('');
    setDeleteError('');
  };

  return (
    <div className={`h-full flex flex-col min-h-0 relative ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${ds.headerBg}`}>
        <div className="flex items-center gap-2">
          <FaWarehouse className="text-yellow-500" size={18} />
          <h2 className="font-bold text-base uppercase tracking-wider">Gestionar Almacenes</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
          <FaTimes size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Branch Filter (Only for Master) */}
        {isMaster ? (
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs uppercase font-bold tracking-wider ${ds.muted}`}>Filtrar por Sucursal</label>
            <select
              value={selectedSucursal}
              onChange={e => setSelectedSucursal(e.target.value)}
              className={`w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
            >
              <option value="Todos">Todas las Sucursales</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre || s.nombreComercial}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            <FaBuilding size={12} />
            <span>Mostrando almacenes para la sucursal: {getBranchName(userSucursalId)}</span>
          </div>
        )}

        {/* Action Buttons */}
        {!showAddForm && (
          <Btn
            variant="primary"
            fullWidth
            leftIcon={<FaPlus size={11} />}
            onClick={() => {
              setNombre('');
              setCreateSucursalId(userSucursalId);
              setShowAddForm(true);
            }}
            className="bg-yellow-500! text-black! hover:bg-yellow-400!"
          >
            Nuevo Almacén
          </Btn>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-yellow-500/20 ring-1 ring-yellow-500/10">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className={`font-bold text-sm uppercase ${ds.text}`}>Crear Almacén</h3>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-gray-400 hover:text-red-400">Cancelar</button>
              </div>

              <div>
                <label className={`text-xs uppercase font-semibold block mb-1 ${ds.muted}`}>Nombre del Almacén</label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="ej. Almacén A - Repuestos"
                  required
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                />
              </div>

              {isMaster && (
                <div>
                  <label className={`text-xs uppercase font-semibold block mb-1 ${ds.muted}`}>Asignar a Sucursal</label>
                  <select
                    value={createSucursalId}
                    onChange={e => setCreateSucursalId(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                  >
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre || s.nombreComercial}</option>
                    ))}
                  </select>
                </div>
              )}

              <Btn
                type="submit"
                variant="primary"
                fullWidth
                className="bg-yellow-500! text-black! hover:bg-yellow-400!"
              >
                Crear Almacén
              </Btn>
            </form>
          </Card>
        )}

        {/* Warehouse Cards Grid */}
        <div className="space-y-4">
          <h3 className={`font-bold text-xs uppercase tracking-wider ${ds.muted}`}>Listado de Almacenes ({filteredAlmacenes.length})</h3>
          
          {filteredAlmacenes.length === 0 ? (
            <div className={`text-center py-8 text-sm ${ds.muted}`}>
              No hay almacenes creados en esta sección.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAlmacenes.map(w => {
                const totalLotes = lotes.filter(l => l.almacenId === w.id).length;
                return (
                  <Card key={w.id} padding="sm" className="relative group hover:border-yellow-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 pr-8">
                        <h4 className={`font-bold text-sm ${ds.text}`}>{w.nombre}</h4>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <span className={`flex items-center gap-1 ${ds.muted}`}>
                            <FaCalendarAlt size={10} /> Creado: {w.fechaCreacion}
                          </span>
                          {isMaster && (
                            <span className={`flex items-center gap-1 ${ds.muted}`}>
                              <FaBuilding size={10} /> {getBranchName(w.sucursalId)}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            totalLotes > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            Lotes: {totalLotes}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeletingId(w.id)}
                        title="Eliminar almacén"
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-red-450 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (() => {
        const warehouse = almacenes.find(w => w.id === deletingId);
        const lotesCount = lotes.filter(l => l.almacenId === deletingId).length;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <FaLock className="text-red-400" size={20} />
                </div>
                <h3 className={`font-bold text-base ${ds.text}`}>Eliminar Almacén</h3>
                <p className={`text-sm mt-1 ${ds.muted}`}>
                  ¿Estás seguro de eliminar el almacén <strong>{warehouse?.nombre}</strong>?
                </p>
                {lotesCount > 0 && (
                  <p className="text-xs font-semibold text-red-400 mt-2 bg-red-500/10 p-2 rounded-xl">
                    ⚠ ¡Atención! Este almacén contiene {lotesCount} lote(s). Al eliminarlo, se borrarán todos sus lotes y los productos dentro de ellos de forma IRREVERSIBLE.
                  </p>
                )}
              </div>
              {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
              <form onSubmit={handleDeleteConfirm} className="space-y-4">
                <input
                  type="password"
                  value={deletePwd}
                  onChange={e => { setDeletePwd(e.target.value); setDeleteError(''); }}
                  placeholder="Contraseña del master"
                  autoFocus
                  required
                  className={`w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 ${ds.inputDarkFilled}`}
                />
                <div className="flex gap-3">
                  <Btn variant="secondary" fullWidth onClick={() => { setDeletingId(null); setDeletePwd(''); setDeleteError(''); }}>
                    Cancelar
                  </Btn>
                  <Btn variant="danger" fullWidth type="submit">
                    Confirmar Eliminar
                  </Btn>
                </div>
              </form>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};

export default AlmacenesPanel;
