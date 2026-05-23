import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { useDS } from '../hooks/useDS';
import {
  FaTags, FaPlus, FaPencilAlt, FaTrash, FaTimes, FaSave, FaSearch, FaFilter, FaCalendarAlt, FaGift, FaPercentage, FaReceipt, FaTicketAlt
} from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import RefreshButton from '../components/ui/RefreshButton';

const DEFAULT_PROMOCIONES = [
  { id: '1', nombre: 'PRUEBA DEF', tipo: 'coupon', valorTipo: '%', valor: 50, codigo: 'PRUEBA2', sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-07-27' },
  { id: '2', nombre: 'PRUEBA 10', tipo: 'coupon', valorTipo: '%', valor: 40, codigo: 'INV2026', sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-29', vigenciaHasta: '2026-08-30' },
  { id: '3', nombre: '40% TODO', tipo: 'product', valorTipo: '%', valor: 40, sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-07-23' },
  { id: '4', nombre: '30% TODO', tipo: 'product', valorTipo: '%', valor: 30, sucursales: 'global', estado: 'Activo', aplicaA: 'categoria', aplicaId: 'Bebidas', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-07-22' },
  { id: '5', nombre: '3x2', tipo: 'qty', valorTipo: 'PEN', valor: 0, sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', qtyX: 3, qtyY: 2, qtyTipo: 'gratis', vigenciaDesde: '2026-04-18', vigenciaHasta: '2026-07-29' },
  { id: '6', nombre: 'CLIENTES VIP', tipo: 'coupon', valorTipo: '%', valor: 15, codigo: 'VIP2026', sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-08-30' },
];

const DEFAULT_ROLES_PERMISOS = {
  Administrador: { promociones: { ver: true, crear: true, editar: true, eliminar: true } },
  Vendedor: { promociones: { ver: true, crear: false, editar: false, eliminar: false } },
  Cajero: { promociones: { ver: true, crear: false, editar: false, eliminar: false } },
  Almacenero: { promociones: { ver: false, crear: false, editar: false, eliminar: false } },
};

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
          Ingresa tu contraseña para aplicar los cambios en promociones.
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

const Promociones = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { productos, categorias } = useInventario();

  const [sucursales] = useState(() => {
    const saved = localStorage.getItem('ersoft_sucursales');
    return saved ? JSON.parse(saved) : [
      { id: '1', nombre: 'Sede Principal' },
      { id: '2', nombre: 'Sede Norte' },
      { id: '3', nombre: 'Sede Sur' },
    ];
  });

  const [promociones, setPromociones] = useState(() => {
    const saved = localStorage.getItem('ersoft_promociones');
    return saved ? JSON.parse(saved) : DEFAULT_PROMOCIONES;
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sucursalFilter, setSucursalFilter] = useState('Todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Choose Type, 2: Form Details
  const [editingPromo, setEditingPromo] = useState(null);
  
  const [form, setForm] = useState({
    nombre: '', tipo: 'product', valorTipo: '%', valor: '', codigo: '', 
    sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', aplicaId: '',
    vigenciaDesde: '', vigenciaHasta: '', qtyX: '', qtyY: '', qtyTipo: 'gratis',
    qtyDescuento: '', minCompra: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, id) => {
    if (!userPerms.editar) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const dragIdx = promociones.findIndex(p => p.id === draggedId);
    const targetIdx = promociones.findIndex(p => p.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;

    const updated = [...promociones];
    const [draggedItem] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    setPromociones(updated);
    setDraggedId(null);
  };

  // Check user permissions dynamically
  const [userPerms, setUserPerms] = useState({ ver: true, crear: false, editar: false, eliminar: false });

  useEffect(() => {
    if (user) {
      if (user.role === 'Master') {
        setUserPerms({ ver: true, crear: true, editar: true, eliminar: true });
      } else {
        try {
          const saved = localStorage.getItem('ersoft_roles_permisos');
          const rolesPermisos = saved ? JSON.parse(saved) : {};
          const r = rolesPermisos[user.role] || {};
          setUserPerms(r.promociones || { ver: true, crear: false, editar: false, eliminar: false });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ersoft_promociones', JSON.stringify(promociones));
  }, [promociones]);

  const handleRefresh = () => {
    const saved = localStorage.getItem('ersoft_promociones');
    if (saved) {
      setPromociones(JSON.parse(saved));
    }
  };

  const validate = () => {
    const temp = {};
    if (!form.nombre.trim()) temp.nombre = 'El nombre es obligatorio.';
    
    if (form.tipo === 'qty') {
      const qX = parseInt(form.qtyX);
      const qY = parseInt(form.qtyY);
      if (isNaN(qX) || qX <= 0) temp.qtyX = 'Cantidad X requerida.';
      if (isNaN(qY) || qY <= 0) temp.qtyY = 'Cantidad Y requerida.';
      if (qX <= qY) temp.qtyX = 'X debe ser mayor que Y.';
    } else {
      const val = parseFloat(form.valor);
      if (isNaN(val) || val <= 0) temp.valor = 'Debe ser un valor positivo.';
      if (form.valorTipo === '%' && val > 100) temp.valor = 'Porcentaje no debe exceder 100%.';
    }

    if (form.tipo === 'coupon' && !form.codigo.trim()) {
      temp.codigo = 'El código del cupón es obligatorio.';
    }

    if (form.tipo === 'order') {
      const minC = parseFloat(form.minCompra);
      if (isNaN(minC) || minC < 0) temp.minCompra = 'Monto mínimo inválido.';
    }

    if (!form.vigenciaDesde) temp.vigenciaDesde = 'Fecha inicio requerida.';
    if (!form.vigenciaHasta) temp.vigenciaHasta = 'Fecha término requerida.';
    if (form.vigenciaDesde && form.vigenciaHasta && form.vigenciaDesde > form.vigenciaHasta) {
      temp.vigenciaHasta = 'La fecha de término debe ser posterior.';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChooseType = (type) => {
    setForm(prev => ({
      ...prev,
      tipo: type,
      valorTipo: type === 'qty' ? 'PEN' : '%',
      aplicaA: type === 'order' ? 'pedido' : 'catalogo'
    }));
    setModalStep(2);
  };

  const handleOpenAdd = () => {
    if (!userPerms.crear) return;
    setEditingPromo(null);
    setForm({
      nombre: '', tipo: 'product', valorTipo: '%', valor: '', codigo: '', 
      sucursales: user.role === 'Master' ? 'global' : [user.sucursalId],
      estado: 'Activo', aplicaA: 'catalogo', aplicaId: '',
      vigenciaDesde: '', vigenciaHasta: '', qtyX: '', qtyY: '', qtyTipo: 'gratis',
      qtyDescuento: '', minCompra: ''
    });
    setErrors({});
    setModalStep(1);
    setModalOpen(true);
  };

  const handleOpenEdit = (promo) => {
    if (!userPerms.editar) return;
    setEditingPromo(promo);
    setForm({
      ...promo,
      sucursales: promo.sucursales || 'global'
    });
    setErrors({});
    setModalStep(2);
    setModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    if (!userPerms.eliminar) return;
    if (window.confirm('¿Estás seguro de eliminar esta promoción?')) {
      setPendingAction({ type: 'delete', id });
      setShowPassword(true);
    }
  };

  const handleToggleStatusClick = (id, currentStatus) => {
    if (!userPerms.editar) return;
    const nextStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    setPendingAction({ type: 'toggle', id, nextStatus });
    setShowPassword(true);
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setPendingAction({ type: 'save' });
    setShowPassword(true);
  };

  const handlePasswordConfirmed = () => {
    setShowPassword(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      setPromociones(prev => prev.filter(item => item.id !== pendingAction.id));
    } else if (pendingAction.type === 'toggle') {
      setPromociones(prev => prev.map(item => item.id === pendingAction.id ? { ...item, estado: pendingAction.nextStatus } : item));
    } else if (pendingAction.type === 'save') {
      if (editingPromo) {
        setPromociones(prev => prev.map(item => item.id === editingPromo.id ? { ...item, ...form } : item));
      } else {
        const newId = Date.now().toString();
        setPromociones(prev => [...prev, { id: newId, ...form }]);
      }
      setModalOpen(false);
    }
    setPendingAction(null);
  };

  const filteredPromos = promociones.filter(p => {
    // Search filter
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()));
    
    // Type filter
    const matchesType = typeFilter === 'Todos' || p.tipo === typeFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'Todos' || p.estado === statusFilter;

    // Sucursal filter
    let matchesSucursal = true;
    if (sucursalFilter !== 'Todos') {
      matchesSucursal = p.sucursales === 'global' || 
                        (Array.isArray(p.sucursales) && p.sucursales.includes(sucursalFilter));
    } else {
      // Regular users only see promotions matching their branch or global ones
      if (user && user.role !== 'Master') {
        matchesSucursal = p.sucursales === 'global' || 
                          (Array.isArray(p.sucursales) && p.sucursales.includes(user.sucursalId));
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesSucursal;
  });

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'product': return 'Descuento en productos';
      case 'order': return 'Descuento en el pedido';
      case 'qty': return 'Compra X y obtén Y';
      case 'coupon': return 'Cupón de descuento';
      default: return tipo;
    }
  };

  const getValorFormatted = (p) => {
    if (p.tipo === 'qty') {
      return p.qtyTipo === 'gratis' ? `${p.qtyX}x${p.qtyY}` : `2da al ${p.qtyDescuento}%`;
    }
    return p.valorTipo === '%' ? `${p.valor}%` : `S/. ${parseFloat(p.valor || 0).toFixed(2)}`;
  };

  const isSucursalChecked = (id) => {
    if (form.sucursales === 'global') return true;
    if (Array.isArray(form.sucursales)) return form.sucursales.includes(id);
    return false;
  };

  const handleSucursalCheckbox = (id) => {
    if (form.sucursales === 'global') {
      setForm(prev => ({ ...prev, sucursales: [id] }));
    } else {
      const current = [...form.sucursales];
      if (current.includes(id)) {
        if (current.length > 1) {
          setForm(prev => ({ ...prev, sucursales: current.filter(x => x !== id) }));
        }
      } else {
        setForm(prev => ({ ...prev, sucursales: [...current, id] }));
      }
    }
  };

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
        onBack={() => navigate('/principal')}
        right={
          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={handleRefresh} />
            {userPerms.crear && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors cursor-pointer"
              >
                <FaPlus size={12} /> Agregar Promociones
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 flex flex-col gap-6 px-10 py-6 max-w-7xl mx-auto w-full pb-10 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white">
          <FaTags className="text-yellow-500" />
          <h2 className="font-bold text-base uppercase tracking-wider">Gestión de Promociones y Campañas</h2>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${ds.cardBg}`}>
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative w-full">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nombre o cupón..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <FaFilter size={11} /> Filtros:
            </div>

            {/* Sucursal filter */}
            {user?.role === 'Master' ? (
              <select
                value={sucursalFilter}
                onChange={e => setSucursalFilter(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
              >
                <option value="Todos">Todas las Sucursales</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            ) : null}

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
            >
              <option value="Todos">Todos los Tipos</option>
              <option value="product">Descuento en productos</option>
              <option value="order">Descuento en el pedido</option>
              <option value="qty">Compra X y obtén Y</option>
              <option value="coupon">Cupón de descuento</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Promotions table */}
        <div className={`rounded-2xl border overflow-x-auto ${ds.cardBg}`}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-10">:::</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Nombre Campaña</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Tipo / Valor</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Aplica A</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Cupón</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Vigencia</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Estado</th>
                {userPerms.editar || userPerms.eliminar ? (
                  <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right ${ds.muted}`}>Acciones</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
              {filteredPromos.map(p => (
                <tr
                  key={p.id}
                  draggable={userPerms.editar}
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, p.id)}
                  className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors ${
                    draggedId === p.id ? 'opacity-40 bg-yellow-500/10' : ''
                  } ${userPerms.editar ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-400 select-none">⋮⋮</td>
                  <td className={`px-6 py-4 text-sm font-bold ${ds.text}`}>{p.nombre}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold text-xs">
                      {getValorFormatted(p)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-semibold text-xs text-gray-500 uppercase tracking-wide">
                      {p.aplicaA === 'catalogo' ? 'Catálogo' : p.aplicaA === 'categoria' ? `Categoría: ${p.aplicaId}` : p.aplicaA === 'producto' ? 'Producto específico' : 'Pedido completo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {p.codigo ? (
                      <span className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono font-bold text-xs">
                        {p.codigo}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FaCalendarAlt size={11} /> {p.vigenciaDesde ? p.vigenciaDesde.substring(2).replace(/-/g,'/') : ''} - {p.vigenciaHasta ? p.vigenciaHasta.substring(2).replace(/-/g,'/') : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      disabled={!userPerms.editar}
                      onClick={() => handleToggleStatusClick(p.id, p.estado)}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer
                        ${p.estado === 'Activo'
                          ? 'bg-green-500/15 text-green-500'
                          : 'bg-red-500/15 text-red-500'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${p.estado === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {p.estado}
                    </button>
                  </td>
                  {userPerms.editar || userPerms.eliminar ? (
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        {userPerms.editar && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-white"
                            title="Editar Promoción"
                          >
                            <FaPencilAlt size={12} />
                          </button>
                        )}
                        {userPerms.eliminar && (
                          <button
                            onClick={() => handleDeleteClick(p.id)}
                            className="p-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/25 text-red-500 transition-colors"
                            title="Eliminar Promoción"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {filteredPromos.length === 0 && (
                <tr>
                  <td colSpan="8" className={`text-center py-10 ${ds.muted} text-sm`}>
                    No hay promociones registradas o activas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PROMOTION MODAL FLOW */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          {modalStep === 1 ? (
            /* STEP 1: SELECT TYPE */
            <div className={`w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-4 ${ds.cardBg} border shadow-2xl relative`}>
              <button onClick={() => setModalOpen(false)} className={`absolute top-4 right-4 ${ds.muted} hover:${ds.text}`}>
                <FaTimes size={18} />
              </button>
              
              <div>
                <h3 className={`text-xl font-bold ${ds.text}`}>Nueva Promoción: Elija un tipo</h3>
                <p className={`text-sm mt-1 ${ds.muted}`}>Cada tipo de promoción tiene diferentes opciones. Elija la plantilla que mejor se adapte a su campaña.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Descuento en productos */}
                <button
                  type="button"
                  onClick={() => handleChooseType('product')}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.02] cursor-pointer
                    ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700 hover:border-yellow-400/50 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:border-yellow-500/50 hover:bg-yellow-500/5'}`}
                >
                  <FaPercentage className="text-yellow-500" size={24} />
                  <div>
                    <h4 className={`font-bold text-sm ${ds.text}`}>Descuento en productos</h4>
                    <p className={`text-[11px] mt-1 ${ds.muted}`}>Aplica descuentos a productos, colecciones o categorías específicas (ej. 20% en polos).</p>
                  </div>
                </button>

                {/* Descuento en el pedido */}
                <button
                  type="button"
                  onClick={() => handleChooseType('order')}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.02] cursor-pointer
                    ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700 hover:border-yellow-400/50 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:border-yellow-500/50 hover:bg-yellow-500/5'}`}
                >
                  <FaReceipt className="text-yellow-500" size={24} />
                  <div>
                    <h4 className={`font-bold text-sm ${ds.text}`}>Descuento en el pedido</h4>
                    <p className={`text-[11px] mt-1 ${ds.muted}`}>Aplica un descuento al importe total de la boleta (ej. S/. 10.00 en compras sobre S/. 100).</p>
                  </div>
                </button>

                {/* Compra X y obtén Y */}
                <button
                  type="button"
                  onClick={() => handleChooseType('qty')}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.02] cursor-pointer
                    ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700 hover:border-yellow-400/50 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:border-yellow-500/50 hover:bg-yellow-500/5'}`}
                >
                  <FaGift className="text-yellow-500" size={24} />
                  <div>
                    <h4 className={`font-bold text-sm ${ds.text}`}>Compra X y obtén Y</h4>
                    <p className={`text-[11px] mt-1 ${ds.muted}`}>Crea ofertas por cantidad, como "compra 3 y paga 2" o "la segunda unidad al 50%".</p>
                  </div>
                </button>

                {/* Cupón de descuento */}
                <button
                  type="button"
                  onClick={() => handleChooseType('coupon')}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.02] cursor-pointer
                    ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700 hover:border-yellow-400/50 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:border-yellow-500/50 hover:bg-yellow-500/5'}`}
                >
                  <FaTicketAlt className="text-yellow-500" size={24} />
                  <div>
                    <h4 className={`font-bold text-sm ${ds.text}`}>Cupón de descuento</h4>
                    <p className={`text-[11px] mt-1 ${ds.muted}`}>Genera códigos de un solo uso o genéricos que los clientes pueden canjear al pagar.</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: FILL DETAILS FORM */
            <form onSubmit={handleSaveClick} className={`w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 ${ds.cardBg} border shadow-2xl max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center border-b pb-3 border-gray-200 dark:border-gray-700">
                <h3 className={`text-lg font-bold ${ds.text}`}>
                  {editingPromo ? 'Editar Promoción' : 'Configurar Promoción'} - <span className="text-yellow-500 text-sm font-semibold">{getTipoLabel(form.tipo)}</span>
                </h3>
                <button type="button" onClick={() => setModalOpen(false)} className={`${ds.muted} hover:${ds.text}`}>
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* Campaign Name */}
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Nombre de Campaña <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.nombre ? 'border-red-500' : ''}`}
                    placeholder="ej. Campaña Madre 2026"
                  />
                  {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                </div>

                {/* Specific configs per promotion type */}
                {form.tipo === 'qty' ? (
                  /* Quantity Buy X Get Y */
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                    <p className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>Configuración de Cantidad</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs uppercase tracking-wider block mb-1 ${ds.muted}`}>Compra X unidades</label>
                        <input
                          type="number"
                          value={form.qtyX}
                          onChange={e => setForm(prev => ({ ...prev, qtyX: e.target.value }))}
                          placeholder="ej. 3"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.qtyX ? 'border-red-500' : ''}`}
                        />
                        {errors.qtyX && <p className="text-red-400 text-xs mt-1">{errors.qtyX}</p>}
                      </div>
                      <div>
                        <label className={`text-xs uppercase tracking-wider block mb-1 ${ds.muted}`}>Paga Y unidades</label>
                        <input
                          type="number"
                          value={form.qtyY}
                          onChange={e => setForm(prev => ({ ...prev, qtyY: e.target.value }))}
                          placeholder="ej. 2"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.qtyY ? 'border-red-500' : ''}`}
                        />
                        {errors.qtyY && <p className="text-red-400 text-xs mt-1">{errors.qtyY}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs uppercase tracking-wider block mb-1 ${ds.muted}`}>Tipo Beneficio</label>
                        <select
                          value={form.qtyTipo}
                          onChange={e => setForm(prev => ({ ...prev, qtyTipo: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        >
                          <option value="gratis">Unidad(es) Gratis (ej. 3x2)</option>
                          <option value="descuento">Segunda unidad con descuento %</option>
                        </select>
                      </div>
                      {form.qtyTipo === 'descuento' && (
                        <div>
                          <label className={`text-xs uppercase tracking-wider block mb-1 ${ds.muted}`}>% Descuento 2da Unidad</label>
                          <input
                            type="number"
                            value={form.qtyDescuento}
                            onChange={e => setForm(prev => ({ ...prev, qtyDescuento: e.target.value }))}
                            placeholder="ej. 50"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard Discount inputs (PEN or %) */
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                    <p className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>Monto del Descuento</p>
                    <div className="flex gap-2">
                      <select
                        value={form.valorTipo}
                        onChange={e => setForm(prev => ({ ...prev, valorTipo: e.target.value }))}
                        className={`w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                      >
                        <option value="%">Porcentaje (%)</option>
                        <option value="PEN">Soles (PEN)</option>
                      </select>
                      <input
                        type="number"
                        step="any"
                        value={form.valor}
                        onChange={e => setForm(prev => ({ ...prev, valor: e.target.value }))}
                        placeholder={form.valorTipo === '%' ? 'ej. 20' : 'ej. 15.00'}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.valor ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.valor && <p className="text-red-400 text-xs">{errors.valor}</p>}

                    {/* Code field for coupon type */}
                    {form.tipo === 'coupon' && (
                      <div>
                        <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Código del Cupón <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={form.codigo}
                          onChange={e => setForm(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                          placeholder="ej. SUPER20"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.codigo ? 'border-red-500' : ''}`}
                        />
                        {errors.codigo && <p className="text-red-400 text-xs mt-1">{errors.codigo}</p>}
                      </div>
                    )}

                    {/* Minimum order for order type */}
                    {form.tipo === 'order' && (
                      <div>
                        <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Monto Mínimo de Compra</label>
                        <input
                          type="number"
                          value={form.minCompra}
                          onChange={e => setForm(prev => ({ ...prev, minCompra: e.target.value }))}
                          placeholder="ej. 100.00"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.minCompra ? 'border-red-500' : ''}`}
                        />
                        {errors.minCompra && <p className="text-red-400 text-xs mt-1">{errors.minCompra}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Applies to Selector (if not order type) */}
                {form.tipo !== 'order' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Aplica A</label>
                      <select
                        value={form.aplicaA}
                        onChange={e => setForm(prev => ({ ...prev, aplicaA: e.target.value, aplicaId: '' }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                      >
                        <option value="catalogo">Todo el Catálogo</option>
                        <option value="categoria">Categoría específica</option>
                        <option value="producto">Producto específico</option>
                      </select>
                    </div>

                    {form.aplicaA === 'categoria' && (
                      <div>
                        <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Categoría</label>
                        <select
                          value={form.aplicaId}
                          onChange={e => setForm(prev => ({ ...prev, aplicaId: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        >
                          <option value="">Seleccione Categoría</option>
                          {[...new Set([...categorias.productos, ...categorias.servicios])].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.aplicaA === 'producto' && (
                      <div>
                        <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Producto</label>
                        <select
                          value={form.aplicaId}
                          onChange={e => setForm(prev => ({ ...prev, aplicaId: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        >
                          <option value="">Seleccione Producto</option>
                          {productos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Branch settings (Sucursales) */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>Sucursales de Aplicación</p>
                    {user.role === 'Master' && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, sucursales: prev.sucursales === 'global' ? [sucursales[0].id] : 'global' }))}
                        className="text-[10px] font-bold text-yellow-500 hover:text-yellow-400 uppercase"
                      >
                        {form.sucursales === 'global' ? 'Cambiar a Individuales' : 'Hacer Global (Todas)'}
                      </button>
                    )}
                  </div>

                  {form.sucursales === 'global' ? (
                    <p className="text-xs text-green-500 font-semibold bg-green-500/10 py-1.5 px-3 rounded-lg">
                      Aplica de forma global a todas las sucursales del sistema.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {sucursales.map(s => {
                        const isChecked = isSucursalChecked(s.id);
                        const disabled = user.role !== 'Master'; // Regular users cannot change branch settings
                        return (
                          <label key={s.id} className={`flex items-center gap-2 text-xs font-medium ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} select-none`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabled}
                              onChange={() => handleSucursalCheckbox(s.id)}
                              className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                            />
                            <span className={isChecked ? ds.text : ds.muted}>{s.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Validity (Dates) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Vigencia Desde <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={form.vigenciaDesde}
                      onChange={e => setForm(prev => ({ ...prev, vigenciaDesde: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.vigenciaDesde ? 'border-red-500' : ''}`}
                    />
                    {errors.vigenciaDesde && <p className="text-red-400 text-xs mt-1">{errors.vigenciaDesde}</p>}
                  </div>
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Vigencia Hasta <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={form.vigenciaHasta}
                      onChange={e => setForm(prev => ({ ...prev, vigenciaHasta: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.vigenciaHasta ? 'border-red-500' : ''}`}
                    />
                    {errors.vigenciaHasta && <p className="text-red-400 text-xs mt-1">{errors.vigenciaHasta}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                {modalStep === 2 && !editingPromo && (
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors mr-auto
                      ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-750' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Atrás
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors
                    ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-750' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FaSave size={13} /> {editingPromo ? 'Guardar Cambios' : 'Registrar Promoción'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirmed}
          onCancel={() => { setShowPassword(false); setPendingAction(null); }}
          theme={theme}
          ds={ds}
        />
      )}
    </div>
  );
};

export default Promociones;
