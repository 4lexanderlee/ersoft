import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useInventario } from '../../context/InventarioContext';
import { useDS } from '../../hooks/useDS';
import {
  FaTimes,
  FaPlus,
  FaMinus,
  FaFolder,
  FaFolderOpen,
  FaChevronRight,
  FaChevronDown,
  FaPencilAlt,
  FaTrash,
  FaCheck,
  FaLayerGroup,
  FaTag,
} from 'react-icons/fa';
import Btn from '../ui/Btn';

/* ─── Service Category List ──────────────────────────────────────── */
const ServiceCategoryList = ({ items, newVal, setNew, onAdd, onRemove, theme, ds }) => {
  const itemBg = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 text-gray-200'
    : 'bg-gray-50 border-gray-200 text-gray-700';

  return (
    <div className="space-y-2">
      {items.map(cat => (
        <div key={cat} className={`flex items-center justify-between px-4 py-2 border rounded-full ${itemBg}`}>
          <span className="text-sm font-medium">{cat}</span>
          <button
            type="button"
            onClick={() => onRemove('servicios', cat)}
            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors shrink-0 text-gray-700 dark:bg-gray-700 dark:hover:bg-red-900/40 dark:text-gray-300">
            <FaMinus size={10} />
          </button>
        </div>
      ))}

      <div className={`flex items-center gap-2 border rounded-full px-3 py-1.5 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
        <input
          value={newVal}
          onChange={e => setNew(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder="Nueva categoría de servicio..."
          className={`flex-1 bg-transparent text-sm outline-none ${ds.text}`}
        />
        <button
          type="button"
          onClick={onAdd}
          className="w-7 h-7 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center shrink-0">
          <FaPlus size={11} className="text-black" />
        </button>
      </div>
    </div>
  );
};

/* ─── AddCategoriasPanel Component ───────────────────────────────── */
const AddCategoriasPanel = ({ onClose }) => {
  const { theme } = useTheme();
  const ds = useDS();
  const {
    arbolCategorias,
    addFamilia,
    updateFamilia,
    deleteFamilia,
    addCategoriaNode,
    updateCategoriaNode,
    deleteCategoriaNode,
    addSubcategoriaNode,
    updateSubcategoriaNode,
    deleteSubcategoriaNode,
    categorias,
    addCategoria,
    removeCategoria,
  } = useInventario();

  const [activeTab, setActiveTab] = useState('arbol'); // 'arbol' | 'servicios'

  // Tree UI state
  const [collapsedFamilias, setCollapsedFamilias] = useState({});
  const [collapsedCategorias, setCollapsedCategorias] = useState({});

  // Add inputs
  const [newFamiliaName, setNewFamiliaName] = useState('');
  const [addingCatFamiliaId, setAddingCatFamiliaId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [addingSubcatId, setAddingSubcatId] = useState(null); // { familiaId, catId }
  const [newSubcatName, setNewSubcatName] = useState('');

  // Editing state
  const [editingNode, setEditingNode] = useState(null); // { type: 'fam'|'cat'|'sub', id, familiaId, catId, name }

  // Services category state
  const [newServ, setNewServ] = useState('');

  const toggleFamiliaCollapse = (id) => {
    setCollapsedFamilias(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategoriaCollapse = (id) => {
    setCollapsedCategorias(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFamilia = (e) => {
    e?.preventDefault();
    if (!newFamiliaName.trim()) return;
    addFamilia(newFamiliaName.trim());
    setNewFamiliaName('');
  };

  const handleCreateCategoria = (familiaId) => {
    if (!newCatName.trim()) return;
    addCategoriaNode(familiaId, newCatName.trim());
    setNewCatName('');
    setAddingCatFamiliaId(null);
    setCollapsedFamilias(prev => ({ ...prev, [familiaId]: false }));
  };

  const handleCreateSubcategoria = (familiaId, catId) => {
    if (!newSubcatName.trim()) return;
    addSubcategoriaNode(familiaId, catId, newSubcatName.trim());
    setNewSubcatName('');
    setAddingSubcatId(null);
    setCollapsedCategorias(prev => ({ ...prev, [catId]: false }));
  };

  const handleSaveEdit = () => {
    if (!editingNode || !editingNode.name.trim()) return;
    if (editingNode.type === 'fam') {
      updateFamilia(editingNode.id, editingNode.name.trim());
    } else if (editingNode.type === 'cat') {
      updateCategoriaNode(editingNode.familiaId, editingNode.id, editingNode.name.trim());
    } else if (editingNode.type === 'sub') {
      updateSubcategoriaNode(editingNode.familiaId, editingNode.catId, editingNode.id, editingNode.name.trim());
    }
    setEditingNode(null);
  };

  const handleAddServ = () => {
    if (!newServ.trim()) return;
    addCategoria('servicios', newServ.trim());
    setNewServ('');
  };

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Panel Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <FaLayerGroup className="text-yellow-500" size={18} />
          <h2 className={`font-bold text-base italic ${ds.text}`}>Gestión de Categorías</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
          <FaTimes size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <button
          type="button"
          onClick={() => setActiveTab('arbol')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'arbol'
              ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Árbol de 3 Niveles (Productos)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'servicios'
              ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Categorías de Servicios
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {activeTab === 'arbol' && (
          <div className="space-y-4">
            {/* Create new Familia Bar */}
            <form onSubmit={handleCreateFamilia} className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`block text-xs font-bold uppercase mb-2 ${ds.muted}`}>
                + Crear Nueva Familia Principal
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFamiliaName}
                  onChange={e => setNewFamiliaName(e.target.value)}
                  placeholder="ej. Textil y Moda, Calzado, Insumos..."
                  className={`flex-1 px-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                />
                <Btn type="submit" size="sm" variant="primary" className="bg-yellow-500! text-black! hover:bg-yellow-400!">
                  Agregar Familia
                </Btn>
              </div>
            </form>

            {/* Tree View */}
            <div className="space-y-3">
              {arbolCategorias.length === 0 ? (
                <p className={`text-xs text-center py-6 ${ds.muted}`}>No hay familias registradas. Agrega una arriba.</p>
              ) : (
                arbolCategorias.map(fam => {
                  const isFamCollapsed = collapsedFamilias[fam.id];
                  const isEditingFam = editingNode?.type === 'fam' && editingNode.id === fam.id;

                  return (
                    <div
                      key={fam.id}
                      className={`rounded-2xl border transition-all ${
                        theme === 'dark' ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white shadow-xs'
                      }`}
                    >
                      {/* Level 1: Familia Header */}
                      <div className="flex items-center justify-between p-3 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleFamiliaCollapse(fam.id)}
                            className="p-1 hover:text-yellow-500 transition-colors text-gray-400"
                          >
                            {isFamCollapsed ? <FaChevronRight size={12} /> : <FaChevronDown size={12} />}
                          </button>
                          {isFamCollapsed ? (
                            <FaFolder className="text-yellow-500 shrink-0" size={16} />
                          ) : (
                            <FaFolderOpen className="text-yellow-500 shrink-0" size={16} />
                          )}

                          {isEditingFam ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                autoFocus
                                value={editingNode.name}
                                onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                                className={`px-2 py-1 text-sm font-bold border rounded-lg outline-none ${ds.inputCls} flex-1`}
                              />
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                                <FaCheck size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNode(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-500/10 rounded-lg">
                                <FaTimes size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className={`font-bold text-sm truncate ${ds.text}`}>{fam.nombre}</span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {(fam.categorias || []).length} cat.
                          </span>
                        </div>

                        {/* Familia Action Buttons */}
                        {!isEditingFam && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setAddingCatFamiliaId(fam.id);
                                setNewCatName('');
                              }}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 transition-colors flex items-center gap-1"
                              title="Agregar categoría a esta familia"
                            >
                              <FaPlus size={9} /> Cat
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNode({ type: 'fam', id: fam.id, name: fam.nombre })}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Editar nombre"
                            >
                              <FaPencilAlt size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar la familia "${fam.nombre}" y sus categorías?`)) {
                                  deleteFamilia(fam.id);
                                }
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar familia"
                            >
                              <FaTrash size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Add Categoria inline input */}
                      {addingCatFamiliaId === fam.id && (
                        <div className={`mx-3 mb-2 p-2 rounded-xl border flex gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-amber-50/50 border-amber-200'}`}>
                          <input
                            autoFocus
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleCreateCategoria(fam.id); }}
                            placeholder="Nombre de la categoría (ej. Polos)..."
                            className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none ${ds.inputCls}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateCategoria(fam.id)}
                            className="px-3 py-1.5 bg-yellow-500 text-black font-bold text-xs rounded-lg hover:bg-yellow-400">
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingCatFamiliaId(null)}
                            className="px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">
                            Cancelar
                          </button>
                        </div>
                      )}

                      {/* Level 2: Categorias */}
                      {!isFamCollapsed && (
                        <div className="pl-6 pr-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800/80 pt-2">
                          {(fam.categorias || []).length === 0 ? (
                            <p className={`text-xs italic pl-4 py-1 ${ds.muted}`}>Sin categorías en esta familia.</p>
                          ) : (
                            fam.categorias.map(cat => {
                              const isCatCollapsed = collapsedCategorias[cat.id];
                              const isEditingCat = editingNode?.type === 'cat' && editingNode.id === cat.id;
                              const isAddingSub = addingSubcatId?.catId === cat.id;

                              return (
                                <div
                                  key={cat.id}
                                  className={`rounded-xl border ${
                                    theme === 'dark' ? 'border-gray-700/60 bg-gray-900/40' : 'border-gray-200 bg-gray-50/70'
                                  }`}
                                >
                                  {/* Categoria Header */}
                                  <div className="flex items-center justify-between p-2.5 gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => toggleCategoriaCollapse(cat.id)}
                                        className="p-1 hover:text-yellow-500 text-gray-400 transition-colors"
                                      >
                                        {isCatCollapsed ? <FaChevronRight size={10} /> : <FaChevronDown size={10} />}
                                      </button>
                                      <FaTag className="text-amber-500 shrink-0" size={13} />

                                      {isEditingCat ? (
                                        <div className="flex items-center gap-1 flex-1">
                                          <input
                                            autoFocus
                                            value={editingNode.name}
                                            onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                                            className={`px-2 py-0.5 text-xs font-semibold border rounded outline-none ${ds.inputCls} flex-1`}
                                          />
                                          <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                            <FaCheck size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingNode(null)}
                                            className="p-1 text-gray-400 hover:bg-gray-500/10 rounded">
                                            <FaTimes size={11} />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className={`font-semibold text-xs truncate ${ds.text}`}>{cat.nombre}</span>
                                      )}
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                        theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {(cat.subcategorias || []).length} sub.
                                      </span>
                                    </div>

                                    {/* Categoria Actions */}
                                    {!isEditingCat && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddingSubcatId({ familiaId: fam.id, catId: cat.id });
                                            setNewSubcatName('');
                                          }}
                                          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1"
                                          title="Agregar subcategoría"
                                        >
                                          <FaPlus size={8} /> Sub
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingNode({ type: 'cat', id: cat.id, familiaId: fam.id, name: cat.nombre })}
                                          className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                                          title="Editar categoría"
                                        >
                                          <FaPencilAlt size={10} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) {
                                              deleteCategoriaNode(fam.id, cat.id);
                                            }
                                          }}
                                          className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                          title="Eliminar categoría"
                                        >
                                          <FaTrash size={10} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Add Subcategoria inline input */}
                                  {isAddingSub && (
                                    <div className={`mx-3 mb-2 p-2 rounded-lg border flex gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-amber-200'}`}>
                                      <input
                                        autoFocus
                                        value={newSubcatName}
                                        onChange={e => setNewSubcatName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleCreateSubcategoria(fam.id, cat.id); }}
                                        placeholder="Nombre subcategoría (ej. Manga Corta)..."
                                        className={`flex-1 px-2.5 py-1 text-xs rounded border outline-none ${ds.inputCls}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCreateSubcategoria(fam.id, cat.id)}
                                        className="px-2.5 py-1 bg-yellow-500 text-black font-bold text-xs rounded hover:bg-yellow-400">
                                        Guardar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAddingSubcatId(null)}
                                        className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs">
                                        Cancelar
                                      </button>
                                    </div>
                                  )}

                                  {/* Level 3: Subcategorias */}
                                  {!isCatCollapsed && (
                                    <div className="pl-8 pr-2 pb-2 space-y-1">
                                      {(cat.subcategorias || []).length === 0 ? (
                                        <p className={`text-[11px] italic py-0.5 ${ds.muted}`}>Sin subcategorías.</p>
                                      ) : (
                                        cat.subcategorias.map(sub => {
                                          const isEditingSub = editingNode?.type === 'sub' && editingNode.id === sub.id;

                                          return (
                                            <div
                                              key={sub.id}
                                              className={`flex items-center justify-between py-1 px-2 rounded-lg text-xs ${
                                                theme === 'dark' ? 'hover:bg-gray-800/60' : 'hover:bg-gray-100/80'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                                {isEditingSub ? (
                                                  <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                      autoFocus
                                                      value={editingNode.name}
                                                      onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                                                      className={`px-2 py-0.5 text-xs border rounded outline-none ${ds.inputCls} flex-1`}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={handleSaveEdit}
                                                      className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                                      <FaCheck size={10} />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditingNode(null)}
                                                      className="p-1 text-gray-400 hover:bg-gray-500/10 rounded">
                                                      <FaTimes size={10} />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <span className={`truncate ${ds.text}`}>{sub.nombre}</span>
                                                )}
                                              </div>

                                              {!isEditingSub && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditingNode({
                                                      type: 'sub',
                                                      id: sub.id,
                                                      familiaId: fam.id,
                                                      catId: cat.id,
                                                      name: sub.nombre,
                                                    })}
                                                    className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                                                    title="Editar subcategoría"
                                                  >
                                                    <FaPencilAlt size={9} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (window.confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`)) {
                                                        deleteSubcategoriaNode(fam.id, cat.id, sub.id);
                                                      }
                                                    }}
                                                    className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Eliminar subcategoría"
                                                  >
                                                    <FaTrash size={9} />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'servicios' && (
          <div>
            <h3 className={`text-xs font-bold uppercase mb-2 ${ds.muted}`}>Categorías de Servicios</h3>
            <div className={`p-4 border rounded-2xl ${theme === 'dark' ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white'}`}>
              <ServiceCategoryList
                items={categorias.servicios || []}
                newVal={newServ}
                setNew={setNewServ}
                onAdd={handleAddServ}
                onRemove={removeCategoria}
                theme={theme}
                ds={ds}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCategoriasPanel;

