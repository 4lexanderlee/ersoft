import React, { createContext, useContext, useState } from 'react';

const InventarioContext = createContext();
export const useInventario = () => useContext(InventarioContext);

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const DEFAULT_ALMACENES = [
  { id: 101, nombre: 'Almacén Central Principal', sucursalId: '1', fechaCreacion: '15/01/2025' },
  { id: 102, nombre: 'Almacén Insumos Norte', sucursalId: '2', fechaCreacion: '10/02/2025' },
  { id: 103, nombre: 'Almacén Repuestos Sur', sucursalId: '3', fechaCreacion: '20/03/2025' },
];

export const InventarioProvider = ({ children }) => {
  const [productos, setProductos] = useState(() => {
    const data = load('ersoft_productos', []);
    return data.map(p => ({ ...p, costo: p.costo || 0 }));
  });
  const [servicios, setServicios] = useState(() => {
    const data = load('ersoft_servicios', []);
    return data.map(s => ({ ...s, sucursalId: s.sucursalId || '1' }));
  });
  const [lotes, setLotes] = useState(() => {
    const data = load('ersoft_lotes', []);
    // Fallback: make sure all lotes have an almacenId (e.g. 101 if none exists)
    return data.map(l => ({ ...l, almacenId: l.almacenId || 101 }));
  });
  const [categorias, setCategorias] = useState(() =>
    load('ersoft_categorias', { productos: [], servicios: [] })
  );
  const [almacenes, setAlmacenes] = useState(() => load('ersoft_almacenes', DEFAULT_ALMACENES));

  // Kardex Historial
  const [kardexHistorial, setKardexHistorial] = useState(() => load('ersoft_kardex_historial', []));

  // ── Producto CRUD ──────────────────────────────────────────────
  const addProducto = (p) => {
    const updated = [...productos, { ...p, id: Date.now() }];
    setProductos(updated); save('ersoft_productos', updated);
  };
  const updateProducto = (id, data) => {
    const updated = productos.map(p => p.id === id ? { ...p, ...data } : p);
    setProductos(updated); save('ersoft_productos', updated);
  };

  /**
   * Atomically update the stock of multiple products in one operation.
   * changes: Array<{ id: productId, delta: number }>
   *   delta > 0  → adds stock (e.g. void/annul)
   *   delta < 0  → subtracts stock (e.g. sale)
   * Uses the functional updater form of setProductos so it always reads
   * the latest state, avoiding stale-closure issues when called from loops.
   */
  const bulkUpdateStock = (changes) => {
    setProductos(prev => {
      const updated = prev.map(p => {
        const change = changes.find(c => c.id === p.id);
        if (!change) return p;
        return { ...p, stock: Math.max(0, (p.stock || 0) + change.delta) };
      });
      save('ersoft_productos', updated);
      return updated;
    });
  };
  const deleteProducto = (id) => {
    setProductos(prev => {
      const updated = prev.filter(p => p.id !== id);
      save('ersoft_productos', updated);
      return updated;
    });
  };

  /** Returns true if barcode is already taken by another product */
  const isBarcodeInUse = (barcode, excludeId = null) => {
    if (!barcode || String(barcode).trim() === '') return false;
    return productos.some(
      p => p.codigoBarras && p.codigoBarras === String(barcode).trim() && p.id !== excludeId
    );
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
    setServicios(prev => {
      const updated = prev.filter(s => s.id !== id);
      save('ersoft_servicios', updated);
      return updated;
    });
  };

  // ── Lotes ──────────────────────────────────────────────────────
  const createLote = (nombre, almacenId) => {
    const lote = {
      id: Date.now(),
      nombre,
      almacenId: Number(almacenId),
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

  const deleteLote = (id) => {
    // 1. Delete lote
    const updated = lotes.filter(l => l.id !== id);
    setLotes(updated); save('ersoft_lotes', updated);

    // 2. Cascade delete products belonging to this lote
    setProductos(prev => {
      const next = prev.filter(p => p.loteId !== id);
      if (next.length !== prev.length) save('ersoft_productos', next);
      return next;
    });
  };

  const loteActivo = lotes.find(l => l.estado === 'Activo') || null;

  // When a product is added, increment specific lote's totalProductos
  const incrementLoteCount = (loteId) => {
    const updated = lotes.map(l =>
      l.id === loteId ? { ...l, totalProductos: l.totalProductos + 1 } : l
    );
    setLotes(updated); save('ersoft_lotes', updated);
  };

  // ── Almacenes CRUD ──────────────────────────────────────────────
  const addAlmacen = (nombre, sucursalId) => {
    const newAlmacen = {
      id: Date.now(),
      nombre: nombre.trim(),
      sucursalId,
      fechaCreacion: new Date().toLocaleDateString('es-PE'),
    };
    setAlmacenes(prev => {
      const updated = [...prev, newAlmacen];
      save('ersoft_almacenes', updated);
      return updated;
    });
  };

  const deleteAlmacen = (almacenId) => {
    setAlmacenes(prev => {
      const updated = prev.filter(w => w.id !== almacenId);
      save('ersoft_almacenes', updated);
      return updated;
    });

    const lotesToDelete = lotes.filter(l => l.almacenId === almacenId);
    const loteIdsToDelete = lotesToDelete.map(l => l.id);

    if (loteIdsToDelete.length > 0) {
      setLotes(prev => {
        const updated = prev.filter(l => !loteIdsToDelete.includes(l.id));
        save('ersoft_lotes', updated);
        return updated;
      });

      setProductos(prev => {
        const updated = prev.filter(p => !loteIdsToDelete.includes(p.loteId));
        save('ersoft_productos', updated);
        return updated;
      });
    }
  };

  const refreshData = () => {
    setProductos(() => {
      const data = load('ersoft_productos', []);
      return data.map(p => ({ ...p, costo: p.costo || 0 }));
    });
    setServicios(() => {
      const data = load('ersoft_servicios', []);
      return data.map(s => ({ ...s, sucursalId: s.sucursalId || '1' }));
    });
    setLotes(() => {
      const data = load('ersoft_lotes', []);
      return data.map(l => ({ ...l, almacenId: l.almacenId || 101 }));
    });
    setCategorias(() => load('ersoft_categorias', { productos: [], servicios: [] }));
    setAlmacenes(() => load('ersoft_almacenes', DEFAULT_ALMACENES));
  };

  // ── Categorias ─────────────────────────────────────────────────
  const addCategoria = (tipo, nombre) => {
    const updated = { ...categorias, [tipo]: [...categorias[tipo], nombre] };
    setCategorias(updated); save('ersoft_categorias', updated);
  };
  const removeCategoria = (tipo, nombre) => {
    // 1. Remove from context
    const updated = { ...categorias, [tipo]: categorias[tipo].filter(c => c !== nombre) };
    setCategorias(updated); save('ersoft_categorias', updated);

    // 2. Remove the category from all products/services
    if (tipo === 'productos') {
      setProductos(prev => {
        const next = prev.map(p => {
          let cats = p.categorias || (p.categoria ? [p.categoria] : []);
          if (cats.includes(nombre)) {
            cats = cats.filter(c => c !== nombre);
            return { ...p, categorias: cats, categoria: undefined }; // clear legacy field too
          }
          return p;
        });
        save('ersoft_productos', next);
        return next;
      });
    } else if (tipo === 'servicios') {
      setServicios(prev => {
        const next = prev.map(s => {
          let cats = s.categorias || (s.categoria ? [s.categoria] : []);
          if (cats.includes(nombre)) {
            cats = cats.filter(c => c !== nombre);
            return { ...s, categorias: cats, categoria: undefined };
          }
          return s;
        });
        save('ersoft_servicios', next);
        return next;
      });
    }
  };

  // ── Bulk import ────────────────────────────────────────────────
  /**
   * Bulk-insert products and services from the CSV/XLSX import modal.
   * Each item must have: tipo, nombre, precio, and other optional fields.
   */
  const bulkImport = (items) => {
    const ts = Date.now();
    const newProductos = items
      .filter(i => i.tipo === 'Producto')
      .map((i, idx) => ({ ...i, id: ts + idx }));
    const newServicios = items
      .filter(i => i.tipo === 'Servicio')
      .map((i, idx) => ({ ...i, id: ts + 10000 + idx }));

    if (newProductos.length > 0) {
      const updatedP = [...productos, ...newProductos];
      setProductos(updatedP); save('ersoft_productos', updatedP);
      // Update lote product counts
      const loteCountMap = {};
      newProductos.forEach(p => {
        if (p.loteId) loteCountMap[p.loteId] = (loteCountMap[p.loteId] || 0) + 1;
      });
      if (Object.keys(loteCountMap).length > 0) {
        const updatedLotes = lotes.map(l =>
          loteCountMap[l.id] ? { ...l, totalProductos: (l.totalProductos || 0) + loteCountMap[l.id] } : l
        );
        setLotes(updatedLotes); save('ersoft_lotes', updatedLotes);
      }
    }
    if (newServicios.length > 0) {
      const updatedS = [...servicios, ...newServicios];
      setServicios(updatedS); save('ersoft_servicios', updatedS);
    }
  };

  // ── Kardex CRUD ────────────────────────────────────────────────
  const addKardexReport = (report) => {
    const newReport = { ...report, id: Date.now() };
    const updated = [newReport, ...kardexHistorial];
    setKardexHistorial(updated); save('ersoft_kardex_historial', updated);
  };
  const updateKardexReport = (id, data) => {
    const updated = kardexHistorial.map(k => k.id === id ? { ...k, ...data } : k);
    setKardexHistorial(updated); save('ersoft_kardex_historial', updated);
  };
  const deleteKardexReport = (id) => {
    const updated = kardexHistorial.filter(k => k.id !== id);
    setKardexHistorial(updated); save('ersoft_kardex_historial', updated);
  };

  return (
    <InventarioContext.Provider value={{
      productos, addProducto, updateProducto, deleteProducto, isBarcodeInUse,
      bulkUpdateStock,
      servicios, addServicio, updateServicio, deleteServicio,
      lotes, loteActivo, createLote, cerrarLote, deleteLote, incrementLoteCount,
      categorias, addCategoria, removeCategoria,
      bulkImport,
      almacenes, addAlmacen, deleteAlmacen, refreshData,
      kardexHistorial, addKardexReport, updateKardexReport, deleteKardexReport,
    }}>
      {children}
    </InventarioContext.Provider>
  );
};
