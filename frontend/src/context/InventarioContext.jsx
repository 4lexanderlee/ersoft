import React, { createContext, useContext, useState } from 'react';

const InventarioContext = createContext();
export const useInventario = () => useContext(InventarioContext);

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const InventarioProvider = ({ children }) => {
  const [productos, setProductos] = useState(() => load('ersoft_productos', []));
  const [servicios, setServicios] = useState(() => load('ersoft_servicios', []));
  const [lotes, setLotes] = useState(() => load('ersoft_lotes', []));
  const [categorias, setCategorias] = useState(() =>
    load('ersoft_categorias', { productos: [], servicios: [] })
  );

  // ── Producto CRUD ──────────────────────────────────────────────
  const addProducto = (p) => {
    const updated = [...productos, { ...p, id: Date.now() }];
    setProductos(updated); save('ersoft_productos', updated);
  };
  const updateProducto = (id, data) => {
    const updated = productos.map(p => p.id === id ? { ...p, ...data } : p);
    setProductos(updated); save('ersoft_productos', updated);
  };
  const deleteProducto = (id) => {
    const updated = productos.filter(p => p.id !== id);
    setProductos(updated); save('ersoft_productos', updated);
  };

  // ── Servicio CRUD ──────────────────────────────────────────────
  const addServicio = (s) => {
    const updated = [...servicios, { ...s, id: Date.now() }];
    setServicios(updated); save('ersoft_servicios', updated);
  };
  const updateServicio = (id, data) => {
    const updated = servicios.map(s => s.id === id ? { ...s, ...data } : s);
    setServicios(updated); save('ersoft_servicios', updated);
  };
  const deleteServicio = (id) => {
    const updated = servicios.filter(s => s.id !== id);
    setServicios(updated); save('ersoft_servicios', updated);
  };

  // ── Lotes ──────────────────────────────────────────────────────
  const createLote = (nombre) => {
    const lote = {
      id: Date.now(),
      nombre,
      fechaCreacion: new Date().toLocaleDateString('es-PE'),
      fechaCierre: null,
      estado: 'Activo',
      totalProductos: 0,
    };
    const updated = [lote, ...lotes]; // active first
    setLotes(updated); save('ersoft_lotes', updated);
    return lote;
  };
  const cerrarLote = (id) => {
    const updated = lotes.map(l =>
      l.id === id ? { ...l, estado: 'Cerrado', fechaCierre: new Date().toLocaleDateString('es-PE') } : l
    );
    setLotes(updated); save('ersoft_lotes', updated);
  };

  const loteActivo = lotes.find(l => l.estado === 'Activo') || null;

  // When a product is added, increment specific lote's totalProductos
  const incrementLoteCount = (loteId) => {
    const updated = lotes.map(l =>
      l.id === loteId ? { ...l, totalProductos: l.totalProductos + 1 } : l
    );
    setLotes(updated); save('ersoft_lotes', updated);
  };

  // ── Categorias ─────────────────────────────────────────────────
  const addCategoria = (tipo, nombre) => {
    const updated = { ...categorias, [tipo]: [...categorias[tipo], nombre] };
    setCategorias(updated); save('ersoft_categorias', updated);
  };
  const removeCategoria = (tipo, nombre) => {
    const updated = { ...categorias, [tipo]: categorias[tipo].filter(c => c !== nombre) };
    setCategorias(updated); save('ersoft_categorias', updated);
  };

  return (
    <InventarioContext.Provider value={{
      productos, addProducto, updateProducto, deleteProducto,
      servicios, addServicio, updateServicio, deleteServicio,
      lotes, loteActivo, createLote, cerrarLote, incrementLoteCount,
      categorias, addCategoria, removeCategoria,
    }}>
      {children}
    </InventarioContext.Provider>
  );
};
