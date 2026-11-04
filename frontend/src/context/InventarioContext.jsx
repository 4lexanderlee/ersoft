import React, { createContext, useContext, useState } from 'react';

const InventarioContext = createContext();
export const useInventario = () => useContext(InventarioContext);

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const DEFAULT_ALMACENES = [
  { id: 101, nombre: 'Almacén Central Principal', sucursalId: '1', fechaCreacion: '15/01/2025' },
  { id: 102, nombre: 'Almacén Insumos Norte', sucursalId: '2', fechaCreacion: '10/02/2025' },
  { id: 103, nombre: 'Almacén Repuestos Sur', sucursalId: '3', fechaCreacion: '20/03/2025' },
];

const DEFAULT_ARBOL_CATEGORIAS = [
  {
    id: 'fam-textil',
    nombre: 'Textil y Moda',
    categorias: [
      {
        id: 'cat-polos',
        nombre: 'Polos',
        subcategorias: [
          { id: 'sub-manga-corta', nombre: 'Manga Corta' },
          { id: 'sub-manga-larga', nombre: 'Manga Larga' },
          { id: 'sub-cuello-v', nombre: 'Cuello V' },
        ],
      },
      {
        id: 'cat-casacas',
        nombre: 'Casacas',
        subcategorias: [
          { id: 'sub-impermeable', nombre: 'Impermeable' },
          { id: 'sub-algodon', nombre: 'Algodón Térmico' },
        ],
      },
      {
        id: 'cat-pantalones',
        nombre: 'Pantalones',
        subcategorias: [
          { id: 'sub-jean', nombre: 'Jean Clásico' },
          { id: 'sub-jogger', nombre: 'Jogger Deportivo' },
        ],
      },
    ],
  },
  {
    id: 'fam-calzado',
    nombre: 'Calzado',
    categorias: [
      {
        id: 'cat-zapatillas',
        nombre: 'Zapatillas',
        subcategorias: [
          { id: 'sub-urbanas', nombre: 'Urbanas' },
          { id: 'sub-running', nombre: 'Running / Deportivas' },
        ],
      },
      {
        id: 'cat-zapatos',
        nombre: 'Zapatos',
        subcategorias: [
          { id: 'sub-formal', nombre: 'Formal' },
          { id: 'sub-casual', nombre: 'Casual' },
        ],
      },
    ],
  },
  {
    id: 'fam-accesorios',
    nombre: 'Accesorios',
    categorias: [
      {
        id: 'cat-mochilas',
        nombre: 'Mochilas y Bolsos',
        subcategorias: [
          { id: 'sub-mochila-urbana', nombre: 'Mochila Urbana' },
          { id: 'sub-billetera', nombre: 'Billetera' },
        ],
      },
      {
        id: 'cat-gorras',
        nombre: 'Gorras',
        subcategorias: [
          { id: 'sub-snapback', nombre: 'Snapback' },
          { id: 'sub-trucker', nombre: 'Trucker' },
        ],
      },
    ],
  },
  {
    id: 'fam-insumos',
    nombre: 'Insumos y Materiales',
    categorias: [
      {
        id: 'cat-telas',
        nombre: 'Telas',
        subcategorias: [
          { id: 'sub-jersey', nombre: 'Algodón Jersey 30/1' },
          { id: 'sub-poliester', nombre: 'Poliéster Estampado' },
        ],
      },
      {
        id: 'cat-avios',
        nombre: 'Avíos y Fornituras',
        subcategorias: [
          { id: 'sub-hilos', nombre: 'Hilos 40/2' },
          { id: 'sub-botones', nombre: 'Botones Plásticos' },
        ],
      },
    ],
  },
];

const DEFAULT_PRODUCTOS = [
  {
    id: 1001,
    nombre: 'Polo Jersey Clásico Algodón',
    tipo: 'Producto',
    tipoProducto: 'ESTANDAR',
    unidadMedida: 'NIU',
    permite_decimales: false,
    precio: 39.90,
    costo: 18.50,
    stock: 45,
    ventas_acumuladas: 142,
    codigoBarras: '775123456001',
    familia: 'Textil y Moda',
    categoria: 'Polos',
    subcategoria: 'Manga Corta',
    categorias: ['Polos', 'Textil y Moda'],
    loteId: 101,
    descripcion: 'Polo de algodón peinado 30/1, cuello redondo.',
  },
  {
    id: 1002,
    nombre: 'Polo Piqué Premium con Variantes',
    tipo: 'Producto',
    tipoProducto: 'VARIANTES',
    unidadMedida: 'NIU',
    permite_decimales: false,
    precio: 55.00,
    costo: 26.00,
    stock: 60,
    ventas_acumuladas: 98,
    codigoBarras: '775123456002',
    familia: 'Textil y Moda',
    categoria: 'Polos',
    subcategoria: 'Manga Corta',
    categorias: ['Polos', 'Textil y Moda'],
    loteId: 101,
    tallas: ['S', 'M', 'L'],
    colores: ['Negro', 'Blanco'],
    variantes: [
      { id: 'var-1', sku: 'POLO-S-NEG', barcode: '775123456011', talla: 'S', color: 'Negro', stock: 10, precio: 55.00, costo: 26.00, loteId: 101 },
      { id: 'var-2', sku: 'POLO-M-NEG', barcode: '775123456012', talla: 'M', color: 'Negro', stock: 15, precio: 55.00, costo: 26.00, loteId: 101 },
      { id: 'var-3', sku: 'POLO-L-NEG', barcode: '775123456013', talla: 'L', color: 'Negro', stock: 8, precio: 55.00, costo: 26.00, loteId: 101 },
      { id: 'var-4', sku: 'POLO-S-BLA', barcode: '775123456014', talla: 'S', color: 'Blanco', stock: 7, precio: 55.00, costo: 26.00, loteId: 101 },
      { id: 'var-5', sku: 'POLO-M-BLA', barcode: '775123456015', talla: 'M', color: 'Blanco', stock: 12, precio: 55.00, costo: 26.00, loteId: 101 },
      { id: 'var-6', sku: 'POLO-L-BLA', barcode: '775123456016', talla: 'L', color: 'Blanco', stock: 8, precio: 55.00, costo: 26.00, loteId: 101 },
    ],
    descripcion: 'Polo piqué con cuello camisero, matriz de tallas y colores.',
  },
  {
    id: 1003,
    nombre: 'Tela Algodón Pima 50/1 (Por Metro)',
    tipo: 'Producto',
    tipoProducto: 'ESTANDAR',
    unidadMedida: 'MTR',
    permite_decimales: true,
    precio: 29.50,
    costo: 14.20,
    stock: 125.750,
    ventas_acumuladas: 215,
    codigoBarras: '775123456003',
    familia: 'Insumos y Materiales',
    categoria: 'Telas',
    subcategoria: 'Algodón Jersey 30/1',
    categorias: ['Telas', 'Insumos y Materiales'],
    loteId: 101,
    descripcion: 'Rollo de tela algodón pima de exportación vendida al corte fraccionado.',
  },
  {
    id: 1004,
    nombre: 'Hilado Poliéster Industrial (Por Kilo)',
    tipo: 'Producto',
    tipoProducto: 'ESTANDAR',
    unidadMedida: 'KGM',
    permite_decimales: true,
    precio: 44.00,
    costo: 21.00,
    stock: 85.500,
    ventas_acumuladas: 178,
    codigoBarras: '775123456004',
    familia: 'Insumos y Materiales',
    categoria: 'Avíos y Fornituras',
    subcategoria: 'Hilos 40/2',
    categorias: ['Avíos y Fornituras', 'Insumos y Materiales'],
    loteId: 101,
    descripcion: 'Cono de hilado industrial de alta tenacidad pesado en báscula.',
  },
  {
    id: 1005,
    nombre: 'Zapatillas Urbanas Street Pro',
    tipo: 'Producto',
    tipoProducto: 'VARIANTES',
    unidadMedida: 'NIU',
    permite_decimales: false,
    precio: 149.00,
    costo: 75.00,
    stock: 35,
    ventas_acumuladas: 88,
    codigoBarras: '775123456005',
    familia: 'Calzado',
    categoria: 'Zapatillas',
    subcategoria: 'Urbanas',
    categorias: ['Zapatillas', 'Calzado'],
    loteId: 101,
    tallas: ['39', '40', '41', '42'],
    colores: ['Negro/Blanco', 'Gris'],
    variantes: [
      { id: 'var-z1', sku: 'ZAP-39-NB', barcode: '775123456021', talla: '39', color: 'Negro/Blanco', stock: 6, precio: 149.00, costo: 75.00, loteId: 101 },
      { id: 'var-z2', sku: 'ZAP-40-NB', barcode: '775123456022', talla: '40', color: 'Negro/Blanco', stock: 9, precio: 149.00, costo: 75.00, loteId: 101 },
      { id: 'var-z3', sku: 'ZAP-41-NB', barcode: '775123456023', talla: '41', color: 'Negro/Blanco', stock: 8, precio: 149.00, costo: 75.00, loteId: 101 },
      { id: 'var-z4', sku: 'ZAP-42-NB', barcode: '775123456024', talla: '42', color: 'Negro/Blanco', stock: 5, precio: 149.00, costo: 75.00, loteId: 101 },
      { id: 'var-z5', sku: 'ZAP-40-GR', barcode: '775123456025', talla: '40', color: 'Gris', stock: 7, precio: 149.00, costo: 75.00, loteId: 101 },
    ],
    descripcion: 'Zapatillas urbanas de lona con suela vulcanizada.',
  },
  {
    id: 1006,
    nombre: 'Solvente Textil Antiestático (Por Litro)',
    tipo: 'Producto',
    tipoProducto: 'ESTANDAR',
    unidadMedida: 'LTR',
    permite_decimales: true,
    precio: 32.00,
    costo: 15.50,
    stock: 50.250,
    ventas_acumuladas: 54,
    codigoBarras: '775123456006',
    familia: 'Insumos y Materiales',
    categoria: 'Avíos y Fornituras',
    subcategoria: 'Hilos 40/2',
    categorias: ['Insumos y Materiales'],
    loteId: 101,
    descripcion: 'Líquido para acabado de estampados y teñidos.',
  },
  {
    id: 1007,
    nombre: 'Casaca Cortaviento Impermeable',
    tipo: 'Producto',
    tipoProducto: 'ESTANDAR',
    unidadMedida: 'NIU',
    permite_decimales: false,
    precio: 119.00,
    costo: 58.00,
    stock: 28,
    ventas_acumuladas: 165,
    codigoBarras: '775123456007',
    familia: 'Textil y Moda',
    categoria: 'Casacas',
    subcategoria: 'Impermeable',
    categorias: ['Casacas', 'Textil y Moda'],
    loteId: 101,
    descripcion: 'Casaca ligera con forro polar y capucha desmontable.',
  },
  {
    id: 1008,
    nombre: 'Mochila Técnica Urbana 25L',
    tipo: 'Producto',
    tipoProducto: 'ESTANDAR',
    unidadMedida: 'NIU',
    permite_decimales: false,
    precio: 89.90,
    costo: 42.00,
    stock: 32,
    ventas_acumuladas: 190,
    codigoBarras: '775123456008',
    familia: 'Accesorios',
    categoria: 'Mochilas y Bolsos',
    subcategoria: 'Mochila Urbana',
    categorias: ['Mochilas y Bolsos', 'Accesorios'],
    loteId: 101,
    descripcion: 'Compartimento acolchado para laptop 15.6 pulgadas.',
  },
];

const DEFAULT_SERVICIOS = [
  {
    id: 2001,
    nombre: 'Servicio de Estampado Serigráfico Textil',
    tipo: 'Servicio',
    precio: 12.00,
    descripcion: 'Estampado serigráfico hasta 4 colores por prenda.',
    sucursalId: '1',
    categorias: ['Servicios Textiles'],
    ventas_acumuladas: 240,
  },
  {
    id: 2002,
    nombre: 'Bordado Computarizado Institucional',
    tipo: 'Servicio',
    precio: 18.50,
    descripcion: 'Bordado frontal en alta definición con hilo de seda.',
    sucursalId: '1',
    categorias: ['Bordados'],
    ventas_acumuladas: 195,
  },
  {
    id: 2003,
    nombre: 'Corte y Confección Muestral',
    tipo: 'Servicio',
    precio: 65.00,
    descripcion: 'Desarrollo de molde y confección de primera muestra prototipo.',
    sucursalId: '1',
    categorias: ['Moldería y Corte'],
    ventas_acumuladas: 75,
  },
];

const DEFAULT_KARDEX_MOVIMIENTOS = [
  {
    id: 'KM-INIT-001',
    fecha: '2025-01-15 08:30:00',
    productoId: 1001,
    productoNombre: 'Polo Jersey Clásico Algodón',
    sku: '775123456001',
    variante: '-',
    unidadMedida: 'NIU',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'INVENTARIO_INICIAL',
    cantidad: 50,
    costoUnitario: 18.50,
    costoTotal: 925.00,
    saldoFisico: 50,
    costoPromedioPonderado: 18.50,
    saldoValorizado: 925.00,
    motivo: 'Inventario inicial apertura de ejercicio',
    usuario: 'Administrador Master',
  },
  {
    id: 'KM-VENTA-002',
    fecha: '2025-01-20 14:15:20',
    productoId: 1001,
    productoNombre: 'Polo Jersey Clásico Algodón',
    sku: '775123456001',
    variante: '-',
    unidadMedida: 'NIU',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'VENTA',
    cantidad: -5,
    costoUnitario: 18.50,
    costoTotal: 92.50,
    saldoFisico: 45,
    costoPromedioPonderado: 18.50,
    saldoValorizado: 832.50,
    motivo: 'Venta Boleta B001-000142',
    usuario: 'Cajero Principal',
  },
  {
    id: 'KM-INIT-003',
    fecha: '2025-01-15 08:45:00',
    productoId: 1003,
    productoNombre: 'Tela Algodón Pima 50/1 (Por Metro)',
    sku: '775123456003',
    variante: '-',
    unidadMedida: 'MTR',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'INVENTARIO_INICIAL',
    cantidad: 150.000,
    costoUnitario: 14.20,
    costoTotal: 2130.00,
    saldoFisico: 150.000,
    costoPromedioPonderado: 14.20,
    saldoValorizado: 2130.00,
    motivo: 'Inventario inicial rollo textil',
    usuario: 'Administrador Master',
  },
  {
    id: 'KM-VENTA-004',
    fecha: '2025-01-25 11:20:00',
    productoId: 1003,
    productoNombre: 'Tela Algodón Pima 50/1 (Por Metro)',
    sku: '775123456003',
    variante: '-',
    unidadMedida: 'MTR',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'VENTA',
    cantidad: -24.250,
    costoUnitario: 14.20,
    costoTotal: 344.35,
    saldoFisico: 125.750,
    costoPromedioPonderado: 14.20,
    saldoValorizado: 1785.65,
    motivo: 'Venta corte textil Factura F001-00085',
    usuario: 'Cajero Principal',
  },
  {
    id: 'KM-INIT-005',
    fecha: '2025-01-15 09:00:00',
    productoId: 1004,
    productoNombre: 'Hilado Poliéster Industrial (Por Kilo)',
    sku: '775123456004',
    variante: '-',
    unidadMedida: 'KGM',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'INVENTARIO_INICIAL',
    cantidad: 100.000,
    costoUnitario: 21.00,
    costoTotal: 2100.00,
    saldoFisico: 100.000,
    costoPromedioPonderado: 21.00,
    saldoValorizado: 2100.00,
    motivo: 'Inventario inicial de insumos',
    usuario: 'Administrador Master',
  },
  {
    id: 'KM-COMPRA-006',
    fecha: '2025-01-28 16:10:00',
    productoId: 1004,
    productoNombre: 'Hilado Poliéster Industrial (Por Kilo)',
    sku: '775123456004',
    variante: '-',
    unidadMedida: 'KGM',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'COMPRA',
    cantidad: 20.000,
    costoUnitario: 22.00,
    costoTotal: 440.00,
    saldoFisico: 120.000,
    costoPromedioPonderado: 21.17,
    saldoValorizado: 2540.00,
    motivo: 'Compra Proveedor Hilados del Perú F002-392',
    usuario: 'Almacenero Jefe',
  },
  {
    id: 'KM-VENTA-007',
    fecha: '2025-02-02 10:45:00',
    productoId: 1004,
    productoNombre: 'Hilado Poliéster Industrial (Por Kilo)',
    sku: '775123456004',
    variante: '-',
    unidadMedida: 'KGM',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'VENTA',
    cantidad: -34.500,
    costoUnitario: 21.17,
    costoTotal: 730.37,
    saldoFisico: 85.500,
    costoPromedioPonderado: 21.17,
    saldoValorizado: 1809.63,
    motivo: 'Venta orden industrial Factura F001-00102',
    usuario: 'Cajero Principal',
  },
  {
    id: 'KM-INIT-008',
    fecha: '2025-01-15 09:30:00',
    productoId: 1002,
    productoNombre: 'Polo Piqué Premium con Variantes',
    sku: 'POLO-M-NEG',
    variante: 'Talla M / Negro',
    unidadMedida: 'NIU',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'INVENTARIO_INICIAL',
    cantidad: 15,
    costoUnitario: 26.00,
    costoTotal: 390.00,
    saldoFisico: 15,
    costoPromedioPonderado: 26.00,
    saldoValorizado: 390.00,
    motivo: 'Apertura de variante polo piqué',
    usuario: 'Administrador Master',
  },
  {
    id: 'KM-AJUSTE-009',
    fecha: '2025-02-05 18:00:00',
    productoId: 1001,
    productoNombre: 'Polo Jersey Clásico Algodón',
    sku: '775123456001',
    variante: '-',
    unidadMedida: 'NIU',
    almacenId: 101,
    almacenNombre: 'Almacén Central Principal',
    loteId: 101,
    loteNombre: 'Lote Apertura 2025',
    tipoMovimiento: 'AJUSTE_POSITIVO',
    cantidad: 2,
    costoUnitario: 18.50,
    costoTotal: 37.00,
    saldoFisico: 47,
    costoPromedioPonderado: 18.50,
    saldoValorizado: 869.50,
    motivo: 'Ajuste por conteo físico cíclico de bodega',
    usuario: 'Almacenero Jefe',
  },
];

export const InventarioProvider = ({ children }) => {
  const [productos, setProductos] = useState(() => {
    const data = load('ersoft_productos', null);
    if (!data || data.length === 0) {
      save('ersoft_productos', DEFAULT_PRODUCTOS);
      return DEFAULT_PRODUCTOS;
    }
    return data.map(p => ({
      ...p,
      costo: p.costo || 0,
      ventas_acumuladas: Number(p.ventas_acumuladas != null ? p.ventas_acumuladas : Math.floor(Math.random() * 45)),
      unidadMedida: p.unidadMedida || 'NIU',
      permite_decimales: Boolean(p.permite_decimales || ['KGM', 'MTR', 'LTR', 'Kilogramo'].includes(p.unidadMedida)),
      tipoProducto: p.tipoProducto || (p.variantes?.length ? 'VARIANTES' : 'ESTANDAR'),
      variantes: Array.isArray(p.variantes) ? p.variantes : [],
    }));
  });

  const [servicios, setServicios] = useState(() => {
    const data = load('ersoft_servicios', null);
    if (!data || data.length === 0) {
      save('ersoft_servicios', DEFAULT_SERVICIOS);
      return DEFAULT_SERVICIOS;
    }
    return data.map(s => ({
      ...s,
      sucursalId: s.sucursalId || '1',
      ventas_acumuladas: Number(s.ventas_acumuladas != null ? s.ventas_acumuladas : Math.floor(Math.random() * 50)),
    }));
  });

  const [lotes, setLotes] = useState(() => {
    const data = load('ersoft_lotes', []);
    if (!data || data.length === 0) {
      const defaultLotes = [
        { id: 101, nombre: 'Lote Apertura 2025', almacenId: 101, fechaCreacion: '15/01/2025', estado: 'Activo', totalProductos: 8 },
        { id: 102, nombre: 'Lote Norte Secundario', almacenId: 102, fechaCreacion: '10/02/2025', estado: 'Activo', totalProductos: 0 },
      ];
      save('ersoft_lotes', defaultLotes);
      return defaultLotes;
    }
    return data.map(l => ({ ...l, almacenId: l.almacenId || 101 }));
  });

  const [categorias, setCategorias] = useState(() =>
    load('ersoft_categorias', {
      productos: ['Polos', 'Casacas', 'Pantalones', 'Zapatillas', 'Telas', 'Avíos y Fornituras', 'Mochilas y Bolsos'],
      servicios: ['Servicios Textiles', 'Bordados', 'Moldería y Corte'],
    })
  );

  const [arbolCategorias, setArbolCategorias] = useState(() => {
    const tree = load('ersoft_arbol_categorias', null);
    if (!tree || tree.length === 0) {
      save('ersoft_arbol_categorias', DEFAULT_ARBOL_CATEGORIAS);
      return DEFAULT_ARBOL_CATEGORIAS;
    }
    return tree;
  });

  const [almacenes, setAlmacenes] = useState(() => load('ersoft_almacenes', DEFAULT_ALMACENES));

  // Kardex Historial (Saved Snapshots)
  const [kardexHistorial, setKardexHistorial] = useState(() => load('ersoft_kardex_historial', []));

  // Kardex Movimientos (Official Valorized General Ledger)
  const [kardexMovimientos, setKardexMovimientos] = useState(() => {
    const data = load('ersoft_kardex_movimientos', null);
    if (!data || data.length === 0) {
      save('ersoft_kardex_movimientos', DEFAULT_KARDEX_MOVIMIENTOS);
      return DEFAULT_KARDEX_MOVIMIENTOS;
    }
    return data;
  });

  // ── Kardex Ledger Operations ──────────────────────────────────
  const addKardexMovimiento = (mov) => {
    setKardexMovimientos(prev => {
      const prevProductMovs = prev.filter(m => String(m.productoId) === String(mov.productoId));
      const lastMov = prevProductMovs[0]; // newest is first
      const prevStock = lastMov ? parseFloat(lastMov.saldoFisico || 0) : 0;
      const prevCostoProm = lastMov ? parseFloat(lastMov.costoPromedioPonderado || 0) : parseFloat(mov.costoUnitario || 0);
      const prevSaldoValorizado = lastMov ? parseFloat(lastMov.saldoValorizado || 0) : 0;

      const cant = parseFloat(mov.cantidad) || 0;
      const unitCost = parseFloat(mov.costoUnitario) || 0;
      const totalCost = Math.abs(cant) * unitCost;

      const newSaldoFisico = Math.max(0, prevStock + cant);
      let newCostoProm = prevCostoProm;
      let newSaldoValorizado = 0;

      if (cant > 0) {
        newSaldoValorizado = prevSaldoValorizado + totalCost;
        newCostoProm = newSaldoFisico > 0 ? (newSaldoValorizado / newSaldoFisico) : unitCost;
      } else {
        newSaldoValorizado = newSaldoFisico * prevCostoProm;
        newCostoProm = prevCostoProm;
      }

      const fullMov = {
        id: mov.id || `KM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fecha: mov.fecha || new Date().toLocaleString('es-PE'),
        productoId: mov.productoId,
        productoNombre: mov.productoNombre,
        sku: mov.sku || '-',
        variante: mov.variante || '-',
        unidadMedida: mov.unidadMedida || 'NIU',
        almacenId: mov.almacenId || 101,
        almacenNombre: mov.almacenNombre || 'Almacén Central',
        loteId: mov.loteId || 101,
        loteNombre: mov.loteNombre || 'Lote Principal',
        tipoMovimiento: mov.tipoMovimiento || 'AJUSTE_POSITIVO',
        cantidad: cant,
        costoUnitario: unitCost,
        costoTotal: totalCost,
        saldoFisico: newSaldoFisico,
        costoPromedioPonderado: newCostoProm,
        saldoValorizado: newSaldoValorizado,
        motivo: mov.motivo || 'Operación regular',
        usuario: mov.usuario || 'Sistema',
      };

      const updated = [fullMov, ...prev];
      save('ersoft_kardex_movimientos', updated);
      return updated;
    });
  };

  const registrarAjusteManualKardex = ({
    productoId,
    varianteId = null,
    almacenId,
    loteId,
    tipoAjuste, // 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'
    cantidad,
    costoUnitario,
    motivo,
    usuario,
  }) => {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return { success: false, error: 'Producto no encontrado' };

    const cantNum = parseFloat(cantidad) || 0;
    if (cantNum <= 0) return { success: false, error: 'La cantidad debe ser mayor a 0' };

    const delta = tipoAjuste === 'AJUSTE_POSITIVO' ? cantNum : -cantNum;
    const cost = parseFloat(costoUnitario != null ? costoUnitario : (prod.costo || 0));

    let varianteDesc = '-';
    let targetSku = prod.codigoBarras || `SKU-${prod.id}`;
    if (varianteId && prod.variantes?.length) {
      const v = prod.variantes.find(vr => vr.id === varianteId);
      if (v) {
        varianteDesc = `Talla ${v.talla} / Color ${v.color}`;
        targetSku = v.sku || v.barcode || targetSku;
      }
    }

    const alm = almacenes.find(a => String(a.id) === String(almacenId));
    const lt = lotes.find(l => String(l.id) === String(loteId));

    // Update physical product stock
    setProductos(prev => {
      const next = prev.map(p => {
        if (p.id !== productoId) return p;
        if (varianteId && p.variantes?.length) {
          const nextVars = p.variantes.map(vr => {
            if (vr.id !== varianteId) return vr;
            return { ...vr, stock: Math.max(0, (parseFloat(vr.stock) || 0) + delta) };
          });
          const totalStk = nextVars.reduce((sum, vr) => sum + (parseFloat(vr.stock) || 0), 0);
          return { ...p, stock: totalStk, variantes: nextVars };
        }
        return { ...p, stock: Math.max(0, (parseFloat(p.stock) || 0) + delta) };
      });
      save('ersoft_productos', next);
      return next;
    });

    addKardexMovimiento({
      productoId: prod.id,
      productoNombre: prod.nombre,
      sku: targetSku,
      variante: varianteDesc,
      unidadMedida: prod.unidadMedida || 'NIU',
      almacenId,
      almacenNombre: alm?.nombre || 'Almacén Central',
      loteId,
      loteNombre: lt?.nombre || lt?.nombreLote || 'Lote Activo',
      tipoMovimiento: tipoAjuste,
      cantidad: delta,
      costoUnitario: cost,
      motivo: motivo || 'Ajuste manual de inventario',
      usuario: usuario || 'Administrador',
    });

    return { success: true };
  };

  // ── Producto CRUD ──────────────────────────────────────────────
  const addProducto = (p) => {
    const isDecimal = Boolean(p.permite_decimales || ['KGM', 'MTR', 'LTR', 'Kilogramo'].includes(p.unidadMedida));
    const stockVal = isDecimal ? (parseFloat(p.stock) || 0) : (parseInt(p.stock, 10) || 0);

    const newProd = {
      ...p,
      id: Date.now(),
      permite_decimales: isDecimal,
      stock: stockVal,
      costo: parseFloat(p.costo) || 0,
      precio: parseFloat(p.precio) || 0,
      ventas_acumuladas: Number(p.ventas_acumuladas || 0),
      tipoProducto: p.tipoProducto || (p.variantes?.length ? 'VARIANTES' : 'ESTANDAR'),
      variantes: Array.isArray(p.variantes) ? p.variantes : [],
    };

    const updated = [...productos, newProd];
    setProductos(updated);
    save('ersoft_productos', updated);

    // If stock > 0, automatically generate INVENTARIO_INICIAL record in kardex ledger
    const alm = almacenes.find(a => String(a.id) === String(p.almacenId));
    const lt = lotes.find(l => String(l.id) === String(p.loteId));

    if (newProd.tipoProducto === 'VARIANTES' && newProd.variantes?.length > 0) {
      newProd.variantes.forEach(vr => {
        const vrStock = parseFloat(vr.stock) || 0;
        if (vrStock > 0) {
          addKardexMovimiento({
            productoId: newProd.id,
            productoNombre: newProd.nombre,
            sku: vr.sku || vr.barcode || newProd.codigoBarras || `SKU-${newProd.id}`,
            variante: `Talla ${vr.talla} / Color ${vr.color}`,
            unidadMedida: newProd.unidadMedida || 'NIU',
            almacenId: vr.almacenId || p.almacenId || 101,
            almacenNombre: alm?.nombre || 'Almacén Central',
            loteId: vr.loteId || p.loteId || 101,
            loteNombre: lt?.nombre || lt?.nombreLote || 'Lote Inicial',
            tipoMovimiento: 'INVENTARIO_INICIAL',
            cantidad: vrStock,
            costoUnitario: parseFloat(vr.costo != null ? vr.costo : newProd.costo) || 0,
            motivo: 'Inventario inicial de variante de producto',
            usuario: 'Administrador',
          });
        }
      });
    } else if (stockVal > 0) {
      addKardexMovimiento({
        productoId: newProd.id,
        productoNombre: newProd.nombre,
        sku: newProd.codigoBarras || `SKU-${newProd.id}`,
        variante: '-',
        unidadMedida: newProd.unidadMedida || 'NIU',
        almacenId: p.almacenId || 101,
        almacenNombre: alm?.nombre || 'Almacén Central',
        loteId: p.loteId || 101,
        loteNombre: lt?.nombre || lt?.nombreLote || 'Lote Inicial',
        tipoMovimiento: 'INVENTARIO_INICIAL',
        cantidad: stockVal,
        costoUnitario: newProd.costo,
        motivo: 'Inventario inicial de producto',
        usuario: 'Administrador',
      });
    }

    return newProd;
  };

  const updateProducto = (id, data) => {
    const updated = productos.map(p => {
      if (p.id !== id) return p;
      const isDecimal = Boolean(data.permite_decimales != null ? data.permite_decimales : p.permite_decimales);
      const stockVal = data.stock != null
        ? (isDecimal ? parseFloat(data.stock) : parseInt(data.stock, 10))
        : p.stock;
      return {
        ...p,
        ...data,
        permite_decimales: isDecimal,
        stock: stockVal,
        costo: data.costo != null ? parseFloat(data.costo) : p.costo,
        precio: data.precio != null ? parseFloat(data.precio) : p.precio,
      };
    });
    setProductos(updated);
    save('ersoft_productos', updated);
  };

  const bulkUpdateStock = (changes) => {
    setProductos(prev => {
      const updated = prev.map(p => {
        const change = changes.find(c => c.id === p.id);
        if (!change) return p;
        const newStock = Math.max(0, (p.stock || 0) + change.delta);
        return { ...p, stock: newStock };
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

  const isBarcodeInUse = (barcode, excludeId = null) => {
    if (!barcode || String(barcode).trim() === '') return false;
    const clean = String(barcode).trim();
    return productos.some(p => {
      if (p.id === excludeId) return false;
      if (p.codigoBarras && String(p.codigoBarras).trim() === clean) return true;
      if (p.variantes?.some(v => v.barcode && String(v.barcode).trim() === clean)) return true;
      return false;
    });
  };

  // ── Servicio CRUD ──────────────────────────────────────────────
  const addServicio = (s) => {
    const updated = [...servicios, { ...s, id: Date.now(), ventas_acumuladas: Number(s.ventas_acumuladas || 0) }];
    setServicios(updated);
    save('ersoft_servicios', updated);
  };

  const updateServicio = (id, data) => {
    const updated = servicios.map(s => s.id === id ? { ...s, ...data } : s);
    setServicios(updated);
    save('ersoft_servicios', updated);
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
    const updated = [lote, ...lotes];
    setLotes(updated);
    save('ersoft_lotes', updated);
    return lote;
  };

  const cerrarLote = (id) => {
    const updated = lotes.map(l =>
      l.id === id ? { ...l, estado: 'Cerrado', fechaCierre: new Date().toLocaleDateString('es-PE') } : l
    );
    setLotes(updated);
    save('ersoft_lotes', updated);
  };

  const deleteLote = (id) => {
    const updated = lotes.filter(l => l.id !== id);
    setLotes(updated);
    save('ersoft_lotes', updated);

    setProductos(prev => {
      const next = prev.filter(p => p.loteId !== id);
      if (next.length !== prev.length) save('ersoft_productos', next);
      return next;
    });
  };

  const loteActivo = lotes.find(l => l.estado === 'Activo') || null;

  const incrementLoteCount = (loteId) => {
    const updated = lotes.map(l =>
      l.id === loteId ? { ...l, totalProductos: (l.totalProductos || 0) + 1 } : l
    );
    setLotes(updated);
    save('ersoft_lotes', updated);
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

  // ── Categorias (Flat legacy) ──────────────────────────────────
  const addCategoria = (tipo, nombre) => {
    const cleanName = nombre.trim();
    if (!cleanName) return;
    setCategorias(prev => {
      const currentList = prev[tipo] || [];
      if (currentList.includes(cleanName)) return prev;
      const updated = { ...prev, [tipo]: [...currentList, cleanName] };
      save('ersoft_categorias', updated);
      return updated;
    });
  };

  const removeCategoria = (tipo, nombre) => {
    const updated = { ...categorias, [tipo]: (categorias[tipo] || []).filter(c => c !== nombre) };
    setCategorias(updated);
    save('ersoft_categorias', updated);

    if (tipo === 'productos') {
      setProductos(prev => {
        const next = prev.map(p => {
          let cats = p.categorias || (p.categoria ? [p.categoria] : []);
          if (cats.includes(nombre)) {
            cats = cats.filter(c => c !== nombre);
            return { ...p, categorias: cats, categoria: undefined };
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

  // ── 3-Level Hierarchical Tree (Familia -> Categoria -> Subcategoria) ──
  const addFamilia = (nombre) => {
    const clean = nombre.trim();
    if (!clean) return;
    const newFam = {
      id: `fam-${Date.now()}`,
      nombre: clean,
      categorias: [],
    };
    setArbolCategorias(prev => {
      const next = [...prev, newFam];
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const updateFamilia = (id, nombre) => {
    const clean = nombre.trim();
    if (!clean) return;
    setArbolCategorias(prev => {
      const next = prev.map(f => f.id === id ? { ...f, nombre: clean } : f);
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const deleteFamilia = (id) => {
    setArbolCategorias(prev => {
      const next = prev.filter(f => f.id !== id);
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const addCategoriaNode = (familiaId, nombre) => {
    const clean = nombre.trim();
    if (!clean) return;
    const newCat = {
      id: `cat-${Date.now()}`,
      nombre: clean,
      subcategorias: [],
    };
    setArbolCategorias(prev => {
      const next = prev.map(f => {
        if (f.id !== familiaId) return f;
        return { ...f, categorias: [...(f.categorias || []), newCat] };
      });
      save('ersoft_arbol_categorias', next);
      return next;
    });
    addCategoria('productos', clean);
  };

  const updateCategoriaNode = (familiaId, catId, nombre) => {
    const clean = nombre.trim();
    if (!clean) return;
    setArbolCategorias(prev => {
      const next = prev.map(f => {
        if (f.id !== familiaId) return f;
        return {
          ...f,
          categorias: (f.categorias || []).map(c => c.id === catId ? { ...c, nombre: clean } : c),
        };
      });
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const deleteCategoriaNode = (familiaId, catId) => {
    setArbolCategorias(prev => {
      const next = prev.map(f => {
        if (f.id !== familiaId) return f;
        return {
          ...f,
          categorias: (f.categorias || []).filter(c => c.id !== catId),
        };
      });
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const addSubcategoriaNode = (familiaId, catId, nombre) => {
    const clean = nombre.trim();
    if (!clean) return;
    const newSub = {
      id: `sub-${Date.now()}`,
      nombre: clean,
    };
    setArbolCategorias(prev => {
      const next = prev.map(f => {
        if (f.id !== familiaId) return f;
        return {
          ...f,
          categorias: (f.categorias || []).map(c => {
            if (c.id !== catId) return c;
            return { ...c, subcategorias: [...(c.subcategorias || []), newSub] };
          }),
        };
      });
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const updateSubcategoriaNode = (familiaId, catId, subId, nombre) => {
    const clean = nombre.trim();
    if (!clean) return;
    setArbolCategorias(prev => {
      const next = prev.map(f => {
        if (f.id !== familiaId) return f;
        return {
          ...f,
          categorias: (f.categorias || []).map(c => {
            if (c.id !== catId) return c;
            return {
              ...c,
              subcategorias: (c.subcategorias || []).map(s => s.id === subId ? { ...s, nombre: clean } : s),
            };
          }),
        };
      });
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  const deleteSubcategoriaNode = (familiaId, catId, subId) => {
    setArbolCategorias(prev => {
      const next = prev.map(f => {
        if (f.id !== familiaId) return f;
        return {
          ...f,
          categorias: (f.categorias || []).map(c => {
            if (c.id !== catId) return c;
            return {
              ...c,
              subcategorias: (c.subcategorias || []).filter(s => s.id !== subId),
            };
          }),
        };
      });
      save('ersoft_arbol_categorias', next);
      return next;
    });
  };

  // ── Bulk import ────────────────────────────────────────────────
  const bulkImport = (items) => {
    const ts = Date.now();
    const newProductos = items
      .filter(i => i.tipo === 'Producto')
      .map((i, idx) => {
        const isDecimal = Boolean(i.permite_decimales || ['KGM', 'MTR', 'LTR', 'Kilogramo'].includes(i.unidadMedida));
        const stockVal = isDecimal ? (parseFloat(i.stock) || 0) : (parseInt(i.stock, 10) || 0);
        return {
          ...i,
          id: ts + idx,
          costo: parseFloat(i.costo) || 0,
          precio: parseFloat(i.precio) || 0,
          stock: stockVal,
          permite_decimales: isDecimal,
          ventas_acumuladas: Number(i.ventas_acumuladas || 0),
          tipoProducto: i.tipoProducto || (i.variantes?.length ? 'VARIANTES' : 'ESTANDAR'),
          variantes: Array.isArray(i.variantes) ? i.variantes : [],
        };
      });

    const newServicios = items
      .filter(i => i.tipo === 'Servicio')
      .map((i, idx) => ({
        ...i,
        id: ts + 10000 + idx,
        precio: parseFloat(i.precio) || 0,
        ventas_acumuladas: Number(i.ventas_acumuladas || 0),
      }));

    if (newProductos.length > 0) {
      const updatedP = [...productos, ...newProductos];
      setProductos(updatedP);
      save('ersoft_productos', updatedP);

      // Update lote product counts
      const loteCountMap = {};
      newProductos.forEach(p => {
        if (p.loteId) loteCountMap[p.loteId] = (loteCountMap[p.loteId] || 0) + 1;
      });
      if (Object.keys(loteCountMap).length > 0) {
        const updatedLotes = lotes.map(l =>
          loteCountMap[l.id] ? { ...l, totalProductos: (l.totalProductos || 0) + loteCountMap[l.id] } : l
        );
        setLotes(updatedLotes);
        save('ersoft_lotes', updatedLotes);
      }

      // Automatically create INVENTARIO_INICIAL entries in kardex ledger for products with stock > 0
      newProductos.forEach(np => {
        if (np.stock > 0) {
          addKardexMovimiento({
            productoId: np.id,
            productoNombre: np.nombre,
            sku: np.codigoBarras || `SKU-${np.id}`,
            variante: np.talla || np.color ? `Talla: ${np.talla || '-'} / Color: ${np.color || '-'}` : '-',
            unidadMedida: np.unidadMedida || 'NIU',
            almacenId: np.almacenId || 101,
            almacenNombre: 'Almacén Central',
            loteId: np.loteId || 101,
            loteNombre: 'Lote Importación Masiva',
            tipoMovimiento: 'INVENTARIO_INICIAL',
            cantidad: np.stock,
            costoUnitario: np.costo,
            motivo: 'Carga inicial por importador masivo de catálogo',
            usuario: 'Importador Masivo',
          });
        }
      });
    }

    if (newServicios.length > 0) {
      const updatedS = [...servicios, ...newServicios];
      setServicios(updatedS);
      save('ersoft_servicios', updatedS);
    }
  };

  // ── Kardex Historial (Saved Snapshots) ─────────────────────────
  const addKardexReport = (report) => {
    const newReport = { ...report, id: Date.now() };
    const updated = [newReport, ...kardexHistorial];
    setKardexHistorial(updated);
    save('ersoft_kardex_historial', updated);
  };
  const updateKardexReport = (id, data) => {
    const updated = kardexHistorial.map(k => k.id === id ? { ...k, ...data } : k);
    setKardexHistorial(updated);
    save('ersoft_kardex_historial', updated);
  };
  const deleteKardexReport = (id) => {
    const updated = kardexHistorial.filter(k => k.id !== id);
    setKardexHistorial(updated);
    save('ersoft_kardex_historial', updated);
  };

  const refreshData = () => {
    setProductos(() => {
      const data = load('ersoft_productos', DEFAULT_PRODUCTOS);
      return data.map(p => ({
        ...p,
        costo: p.costo || 0,
        ventas_acumuladas: Number(p.ventas_acumuladas || 0),
        unidadMedida: p.unidadMedida || 'NIU',
        permite_decimales: Boolean(p.permite_decimales || ['KGM', 'MTR', 'LTR', 'Kilogramo'].includes(p.unidadMedida)),
        tipoProducto: p.tipoProducto || (p.variantes?.length ? 'VARIANTES' : 'ESTANDAR'),
        variantes: Array.isArray(p.variantes) ? p.variantes : [],
      }));
    });
    setServicios(() => {
      const data = load('ersoft_servicios', DEFAULT_SERVICIOS);
      return data.map(s => ({ ...s, sucursalId: s.sucursalId || '1', ventas_acumuladas: Number(s.ventas_acumuladas || 0) }));
    });
    setLotes(() => {
      const data = load('ersoft_lotes', []);
      return data.map(l => ({ ...l, almacenId: l.almacenId || 101 }));
    });
    setCategorias(() => load('ersoft_categorias', { productos: [], servicios: [] }));
    setArbolCategorias(() => load('ersoft_arbol_categorias', DEFAULT_ARBOL_CATEGORIAS));
    setAlmacenes(() => load('ersoft_almacenes', DEFAULT_ALMACENES));
    setKardexHistorial(() => load('ersoft_kardex_historial', []));
    setKardexMovimientos(() => load('ersoft_kardex_movimientos', DEFAULT_KARDEX_MOVIMIENTOS));
  };

  return (
    <InventarioContext.Provider value={{
      productos, addProducto, updateProducto, deleteProducto, isBarcodeInUse,
      bulkUpdateStock,
      servicios, addServicio, updateServicio, deleteServicio,
      lotes, loteActivo, createLote, cerrarLote, deleteLote, incrementLoteCount,
      categorias, addCategoria, removeCategoria,
      arbolCategorias, addFamilia, updateFamilia, deleteFamilia,
      addCategoriaNode, updateCategoriaNode, deleteCategoriaNode,
      addSubcategoriaNode, updateSubcategoriaNode, deleteSubcategoriaNode,
      bulkImport,
      almacenes, addAlmacen, deleteAlmacen, refreshData,
      kardexHistorial, addKardexReport, updateKardexReport, deleteKardexReport,
      kardexMovimientos, addKardexMovimiento, registrarAjusteManualKardex,
    }}>
      {children}
    </InventarioContext.Provider>
  );
};

