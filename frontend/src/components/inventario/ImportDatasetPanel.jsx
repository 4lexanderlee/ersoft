import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { useDS } from '../../hooks/useDS';
import {
  FaTimes,
  FaUpload,
  FaSearch,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFileExcel,
  FaDownload,
} from 'react-icons/fa';
import Btn from '../ui/Btn';

/**
 * Standard columns supported in ERSOFT Mass Importer:
 * Lote, Almacen, Nombre, Tipo, UNIDAD_MEDIDA, FAMILIA, CATEGORIA, SUBCATEGORIA, TALLA, COLOR,
 * Precio, Costo, Cod Barras, Stock, Descripción, Dsct, Tipo Dsct, Valor Dsct, Vig Inicio, Vig Fin, Imagen url
 */
const COLUMNS = [
  'Lote',
  'Almacen',
  'Nombre',
  'Tipo',
  'UNIDAD_MEDIDA',
  'FAMILIA',
  'CATEGORIA',
  'SUBCATEGORIA',
  'TALLA',
  'COLOR',
  'Precio',
  'Costo',
  'Cod Barras',
  'Stock',
  'Descripción',
  'Dsct',
  'Tipo Dsct',
  'Valor Dsct',
  'Vig Inicio',
  'Vig Fin',
  'Imagen url',
];

const VALID_SUNAT_UMS = new Set(['NIU', 'KGM', 'MTR', 'LTR', 'ZZ', 'UNIDAD', 'KILOGRAMO', 'METRO', 'LITRO']);
const DECIMAL_UMS = new Set(['KGM', 'MTR', 'LTR', 'KILOGRAMO', 'METRO', 'LITRO']);

const safeStr = (v) => (v == null ? '' : String(v).trim());

/**
 * Normalise Excel dates to YYYY-MM-DD
 */
const parseExcelDate = (v) => {
  if (v == null || v === '') return '';

  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const s = String(v).trim();
  if (s === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const [, d, m, y] = dmyDash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const num = parseFloat(s);
  if (!isNaN(num) && num > 1000 && /^\d+(\.\d+)?$/.test(s)) {
    try {
      const d = XLSX.SSF.parse_date_code(num);
      if (d && d.y > 1900) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    } catch { /* ignore */ }
  }

  return '';
};

/**
 * Validate a single row
 */
const validateRow = (row, rowIndex, lotes, existingBarcodes) => {
  const errs = [];
  const tipo = safeStr(row['Tipo']).charAt(0).toUpperCase() + safeStr(row['Tipo']).slice(1).toLowerCase();

  if (!tipo || (tipo !== 'Producto' && tipo !== 'Servicio')) {
    errs.push(`Fila ${rowIndex}: Tipo inválido "${row['Tipo']}" (debe ser Producto o Servicio)`);
  }

  // UM validation
  const rawUM = safeStr(row['UNIDAD_MEDIDA'] || row['UM']).toUpperCase();
  if (rawUM !== '' && !VALID_SUNAT_UMS.has(rawUM)) {
    errs.push(`Fila ${rowIndex}: Unidad de Medida "${rawUM}" inválida. Usa NIU, KGM, MTR, LTR o ZZ.`);
  }

  if (!safeStr(row['Nombre'])) errs.push(`Fila ${rowIndex}: Nombre es obligatorio`);

  if (!safeStr(row['Precio']) || isNaN(parseFloat(safeStr(row['Precio']))) || parseFloat(safeStr(row['Precio'])) < 0) {
    errs.push(`Fila ${rowIndex}: Precio inválido`);
  }
  if (!safeStr(row['Costo']) || isNaN(parseFloat(safeStr(row['Costo']))) || parseFloat(safeStr(row['Costo'])) < 0) {
    errs.push(`Fila ${rowIndex}: Costo inválido (Deje en 0 mínimo)`);
  }

  if (tipo === 'Producto') {
    if (!safeStr(row['Lote'])) {
      errs.push(`Fila ${rowIndex}: Lote es obligatorio para Productos`);
    } else {
      const loteExists = lotes.some(l => l.nombre.trim().toLowerCase() === safeStr(row['Lote']).toLowerCase() && l.estado === 'Activo');
      if (!loteExists) errs.push(`Fila ${rowIndex}: Lote "${row['Lote']}" no existe o no está activo`);
    }

    const stock = safeStr(row['Stock']);
    const isDecimal = DECIMAL_UMS.has(rawUM);
    if (stock !== '') {
      const stockNum = isDecimal ? parseFloat(stock) : parseInt(stock, 10);
      if (isNaN(stockNum) || stockNum < (isDecimal ? 0.001 : 0)) {
        errs.push(`Fila ${rowIndex}: Stock debe ser un número positivo${isDecimal ? ' (decimal permitido, ej. 25.500)' : ''}`);
      }
    }
  }

  // Barcode validation
  const barcode = safeStr(row['Cod Barras']);
  if (barcode !== '') {
    if (!/^\d{6,}$/.test(barcode)) {
      errs.push(`Fila ${rowIndex}: Código de barras "${barcode}" debe tener mínimo 6 dígitos numéricos`);
    } else if (existingBarcodes.has(barcode)) {
      errs.push(`Fila ${rowIndex}: Código de barras "${barcode}" ya está en uso`);
    }
  }

  return errs;
};

const ImportDatasetPanel = ({ onClose }) => {
  const { theme } = useTheme();
  const ds = useDS();
  const { login, user } = useAuth();
  const { lotes, productos, almacenes, bulkImport } = useInventario();

  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const fileRef = useRef(null);

  const existingBarcodes = new Set(
    productos.flatMap(p => [
      p.codigoBarras ? String(p.codigoBarras) : null,
      ...(p.variantes || []).map(v => v.barcode ? String(v.barcode) : null),
    ]).filter(Boolean)
  );

  // ── Download Sample Excel Template ────────────────────────────
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'Lote', 'Almacen', 'Nombre', 'Tipo', 'UNIDAD_MEDIDA',
      'FAMILIA', 'CATEGORIA', 'SUBCATEGORIA', 'TALLA', 'COLOR',
      'Precio', 'Costo', 'Cod Barras', 'Stock', 'Descripción',
    ];

    const activeLoteName = lotes.find(l => l.estado === 'Activo')?.nombre || 'Lote Apertura 2025';
    const activeAlmacenName = almacenes[0]?.nombre || 'Almacén Central Principal';

    const sampleRows = [
      {
        'Lote': activeLoteName,
        'Almacen': activeAlmacenName,
        'Nombre': 'Polo Jersey Clásico Algodón',
        'Tipo': 'Producto',
        'UNIDAD_MEDIDA': 'NIU',
        'FAMILIA': 'Textil y Moda',
        'CATEGORIA': 'Polos',
        'SUBCATEGORIA': 'Manga Corta',
        'TALLA': 'M',
        'COLOR': 'Negro',
        'Precio': 39.90,
        'Costo': 18.00,
        'Cod Barras': '775900000001',
        'Stock': 40,
        'Descripción': 'Polo 100% algodón peinado nacional',
      },
      {
        'Lote': activeLoteName,
        'Almacen': activeAlmacenName,
        'Nombre': 'Hilado de Cono Industrial',
        'Tipo': 'Producto',
        'UNIDAD_MEDIDA': 'KGM',
        'FAMILIA': 'Insumos y Materiales',
        'CATEGORIA': 'Avíos y Fornituras',
        'SUBCATEGORIA': 'Hilos 40/2',
        'TALLA': '',
        'COLOR': 'Blanco Crudo',
        'Precio': 44.00,
        'Costo': 21.00,
        'Cod Barras': '775900000002',
        'Stock': 85.500,
        'Descripción': 'Cono pesado en báscula digital con decimales',
      },
      {
        'Lote': activeLoteName,
        'Almacen': activeAlmacenName,
        'Nombre': 'Tela Algodón Pima 50/1',
        'Tipo': 'Producto',
        'UNIDAD_MEDIDA': 'MTR',
        'FAMILIA': 'Insumos y Materiales',
        'CATEGORIA': 'Telas',
        'SUBCATEGORIA': 'Algodón Jersey 30/1',
        'TALLA': '',
        'COLOR': 'Azul Marino',
        'Precio': 29.50,
        'Costo': 14.20,
        'Cod Barras': '775900000003',
        'Stock': 125.750,
        'Descripción': 'Rollo métrico vendido al corte fraccionado',
      },
      {
        'Lote': '',
        'Almacen': '',
        'Nombre': 'Servicio de Estampado Serigráfico Textil',
        'Tipo': 'Servicio',
        'UNIDAD_MEDIDA': 'ZZ',
        'FAMILIA': 'Servicios',
        'CATEGORIA': 'Servicios Textiles',
        'SUBCATEGORIA': '',
        'TALLA': '',
        'COLOR': '',
        'Precio': 12.00,
        'Costo': 0,
        'Cod Barras': '',
        'Stock': '',
        'Descripción': 'Servicio operativo sin control de kardex físico',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: templateHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla ERSOFT');
    XLSX.writeFile(wb, 'Plantilla_Importacion_ERSOFT.xlsx');
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });

        if (raw.length < 2) {
          alert('El archivo está vacío o no contiene filas de datos.');
          return;
        }

        const headerRow = raw[0].map(h => safeStr(h).toLowerCase());
        const findColIdx = (aliases) => {
          for (const alias of aliases) {
            const idx = headerRow.findIndex(h => h === alias.toLowerCase() || h.replace(/[\s_-]/g, '') === alias.toLowerCase().replace(/[\s_-]/g, ''));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const colIndices = {
          Lote: findColIdx(['Lote']),
          Almacen: findColIdx(['Almacen', 'Almacén']),
          Nombre: findColIdx(['Nombre', 'Item', 'Producto']),
          Tipo: findColIdx(['Tipo']),
          UNIDAD_MEDIDA: findColIdx(['UNIDAD_MEDIDA', 'Unidad_Medida', 'UM', 'Unidad Medida', 'Unidad']),
          FAMILIA: findColIdx(['FAMILIA', 'Familia']),
          CATEGORIA: findColIdx(['CATEGORIA', 'Categoria', 'categoría', 'Categoría']),
          SUBCATEGORIA: findColIdx(['SUBCATEGORIA', 'Subcategoria', 'Subcategoría']),
          TALLA: findColIdx(['TALLA', 'Talla', 'Size']),
          COLOR: findColIdx(['COLOR', 'Color']),
          Precio: findColIdx(['Precio', 'Precio Venta', 'Precio Unitario']),
          Costo: findColIdx(['Costo', 'Costo Compra', 'Costo Unitario']),
          'Cod Barras': findColIdx(['Cod Barras', 'Codigo Barras', 'Código de Barras', 'Barcode']),
          Stock: findColIdx(['Stock', 'Cantidad']),
          Descripción: findColIdx(['Descripción', 'Descripcion', 'Notas']),
          Dsct: findColIdx(['Dsct', 'Descuento']),
          'Tipo Dsct': findColIdx(['Tipo Dsct']),
          'Valor Dsct': findColIdx(['Valor Dsct']),
          'Vig Inicio': findColIdx(['Vig Inicio']),
          'Vig Fin': findColIdx(['Vig Fin']),
          'Imagen url': findColIdx(['Imagen url', 'Imagen']),
        };

        const dataRows = raw.slice(1).filter(r => r.some(c => c !== '' && c != null));
        const parsed = dataRows.map(r => {
          const obj = {};
          COLUMNS.forEach((col, defaultIdx) => {
            const resolvedIdx = colIndices[col] !== -1 ? colIndices[col] : defaultIdx;
            const rawVal = r[resolvedIdx] != null ? r[resolvedIdx] : '';
            if (col === 'Vig Inicio' || col === 'Vig Fin') {
              obj[col] = parseExcelDate(rawVal);
            } else {
              obj[col] = rawVal !== '' && rawVal != null ? String(rawVal).trim() : '';
            }
          });
          return obj;
        });

        // Validate all rows
        const seenBarcodes = new Set(existingBarcodes);
        const allErrors = [];
        parsed.forEach((row, idx) => {
          const errs = validateRow(row, idx + 2, lotes, seenBarcodes);
          if (errs.length > 0) allErrors.push(...errs);
          const bc = safeStr(row['Cod Barras']);
          if (bc && /^\d{6,}$/.test(bc)) seenBarcodes.add(bc);
        });

        setRows(parsed);
        setRowErrors(allErrors);
        setStep('preview');
        setSearch('');
      } catch (err) {
        alert('Error al leer el archivo. Asegúrate de que sea un CSV o XLSX válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    parseFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) { alert('Solo se aceptan archivos CSV o XLSX.'); return; }
    setFileName(file.name);
    parseFile(file);
  };

  const handlePwdConfirm = () => {
    const r = login(user?.username || 'master', pwd);
    if (!r.success) { setPwdError('Contraseña incorrecta'); return; }

    const items = rows.map(row => {
      const tipo = safeStr(row['Tipo']).charAt(0).toUpperCase() + safeStr(row['Tipo']).slice(1).toLowerCase();
      const lote = lotes.find(l => l.nombre.trim().toLowerCase() === safeStr(row['Lote']).toLowerCase() && l.estado === 'Activo');

      const rawUM = safeStr(row['UNIDAD_MEDIDA'] || row['UM']).toUpperCase();
      let unidadMedida = 'NIU';
      if (['KGM', 'KILOGRAMO'].includes(rawUM)) unidadMedida = 'KGM';
      else if (['MTR', 'METRO'].includes(rawUM)) unidadMedida = 'MTR';
      else if (['LTR', 'LITRO'].includes(rawUM)) unidadMedida = 'LTR';
      else if (['ZZ'].includes(rawUM) || tipo === 'Servicio') unidadMedida = 'ZZ';
      else if (['NIU', 'UNIDAD'].includes(rawUM)) unidadMedida = 'NIU';

      const isDecimal = DECIMAL_UMS.has(unidadMedida);

      const almacenNombre = safeStr(row['Almacen']);
      const resolvedAlmacen = almacenNombre
        ? almacenes.find(a => a.nombre.trim().toLowerCase() === almacenNombre.toLowerCase())
        : null;

      const familia = safeStr(row['FAMILIA']);
      const categoria = safeStr(row['CATEGORIA'] || row['categoría']);
      const subcategoria = safeStr(row['SUBCATEGORIA']);
      const talla = safeStr(row['TALLA']);
      const color = safeStr(row['COLOR']);

      const cats = [categoria, familia].filter(Boolean);

      const hasVariantInfo = Boolean(talla || color);
      const stockVal = isDecimal
        ? (parseFloat(safeStr(row['Stock'])) || 0.001)
        : (parseInt(safeStr(row['Stock']), 10) || 1);

      return {
        tipo,
        nombre: safeStr(row['Nombre']),
        precio: parseFloat(safeStr(row['Precio'])) || 0,
        costo: parseFloat(safeStr(row['Costo'])) || 0,
        unidadMedida,
        permite_decimales: isDecimal,
        familia: familia || 'Textil y Moda',
        categoria: categoria || 'General',
        subcategoria: subcategoria || '',
        talla: talla || null,
        color: color || null,
        tipoProducto: hasVariantInfo ? 'VARIANTES' : 'ESTANDAR',
        variantes: hasVariantInfo ? [
          {
            id: `var-imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sku: safeStr(row['Cod Barras']) || `SKU-${talla || 'U'}-${color || 'U'}`,
            barcode: safeStr(row['Cod Barras']) || null,
            talla: talla || 'Estándar',
            color: color || 'Único',
            stock: stockVal,
            precio: parseFloat(safeStr(row['Precio'])) || 0,
            costo: parseFloat(safeStr(row['Costo'])) || 0,
            loteId: lote?.id || null,
          },
        ] : [],
        codigoDsct: safeStr(row['Dsct']) || '',
        tipoDsct: safeStr(row['Tipo Dsct']) || 'PEN',
        valorDsct: safeStr(row['Valor Dsct']) ? parseInt(safeStr(row['Valor Dsct']), 10) : null,
        codigoBarras: safeStr(row['Cod Barras']) || null,
        vigenciaDesde: parseExcelDate(row['Vig Inicio']),
        vigenciaHasta: parseExcelDate(row['Vig Fin']),
        categorias: cats,
        imagen: safeStr(row['Imagen url']) || null,
        stock: tipo === 'Producto' ? stockVal : undefined,
        ventas_acumuladas: 0,
        descripcion: safeStr(row['Descripción']) || '',
        loteId: lote?.id || null,
        almacenId: resolvedAlmacen?.id || lote?.almacenId || 101,
      };
    });

    bulkImport(items);
    setShowPwdModal(false);
    onClose();
  };

  const filtered = rows
    .filter(r => !search || safeStr(r['Nombre']).toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  const hasErrors = rowErrors.length > 0;

  return (
    <>
      <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <FaFileExcel className="text-green-600" size={18} />
            <h2 className={`font-bold text-base italic ${ds.text}`}>Importar Dataset Masivo</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'upload' && (
            <>
              {/* Template Download Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                theme === 'dark' ? 'bg-gray-800/60 border-gray-700' : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <FaFileExcel className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <h4 className={`font-bold text-xs ${ds.text}`}>Plantilla Oficial ERSOFT v1.1</h4>
                    <p className={`text-[11px] ${ds.muted}`}>
                      Incluye columnas de Familia, Categoría, Subcategoría, Talla, Color y Unidades SUNAT (NIU, KGM, MTR, ZZ).
                    </p>
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant="primary"
                  leftIcon={<FaDownload size={11} />}
                  onClick={handleDownloadTemplate}
                  className="bg-emerald-600! hover:bg-emerald-500! text-white! shrink-0 font-bold"
                >
                  Descargar Excel
                </Btn>
              </div>

              <p className={`text-xs ${ds.muted}`}>
                Arrastra o selecciona tu archivo <strong>CSV</strong> o <strong>XLSX</strong>. Se generará automáticamente el movimiento de <strong>INVENTARIO_INICIAL</strong> en el Kardex oficial valorizado.
              </p>

              {/* Supported Columns Guide */}
              <div className={`text-[11px] rounded-xl p-3 font-mono overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {COLUMNS.slice(0, 15).join(' | ')}
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-12 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'border-gray-600 hover:border-yellow-500 hover:bg-yellow-500/5' : 'border-gray-300 hover:border-yellow-500 hover:bg-yellow-50'
                }`}
              >
                <FaUpload size={32} className="text-yellow-500 mb-2" />
                <p className={`font-bold text-sm ${ds.text}`}>Arrastra tu archivo aquí</p>
                <p className={`text-xs mt-1 ${ds.muted}`}>o haz clic para examinar (CSV / XLSX)</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </>
          )}

          {step === 'preview' && (
            <>
              {/* File Info */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold truncate max-w-[70%] ${ds.muted}`}>
                  📄 {fileName} — <strong>{rows.length}</strong> registros encontrados
                </span>
                <button
                  onClick={() => { setStep('upload'); setRows([]); setRowErrors([]); setFileName(''); }}
                  className="text-xs text-yellow-500 hover:underline font-bold"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Search */}
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${ds.inputCls}`}>
                <FaSearch className="text-gray-400" size={12} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filtrar vista previa por nombre..."
                  className="flex-1 bg-transparent outline-none text-xs"
                />
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                <table className="w-full text-[11px] min-w-[750px]">
                  <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}>
                    <tr>
                      <th className="px-2 py-1.5 text-left">Nombre</th>
                      <th className="px-2 py-1.5 text-left">Tipo</th>
                      <th className="px-2 py-1.5 text-left">U.M.</th>
                      <th className="px-2 py-1.5 text-left">Familia</th>
                      <th className="px-2 py-1.5 text-left">Categoría</th>
                      <th className="px-2 py-1.5 text-left">Talla/Color</th>
                      <th className="px-2 py-1.5 text-right">Precio</th>
                      <th className="px-2 py-1.5 text-right">Costo</th>
                      <th className="px-2 py-1.5 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={i} className={`border-t ${theme === 'dark' ? 'border-gray-700/60' : 'border-gray-100'}`}>
                        <td className="px-2 py-1 font-semibold truncate max-w-[150px]">{row['Nombre']}</td>
                        <td className="px-2 py-1">{row['Tipo']}</td>
                        <td className="px-2 py-1 font-mono font-bold text-amber-500">{row['UNIDAD_MEDIDA'] || row['UM'] || 'NIU'}</td>
                        <td className="px-2 py-1 text-gray-400">{row['FAMILIA'] || '—'}</td>
                        <td className="px-2 py-1 text-gray-400">{row['CATEGORIA'] || row['categoría'] || '—'}</td>
                        <td className="px-2 py-1 text-gray-400">
                          {row['TALLA'] || row['COLOR'] ? `${row['TALLA'] || '-'} / ${row['COLOR'] || '-'}` : '—'}
                        </td>
                        <td className="px-2 py-1 text-right">S/. {parseFloat(row['Precio'] || 0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right text-gray-400">S/. {parseFloat(row['Costo'] || 0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right font-bold text-green-500">{row['Stock'] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Errors vs Success */}
              {hasErrors ? (
                <div className={`rounded-xl border p-3 space-y-1.5 ${
                  theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-400" />
                    <span className="font-bold text-red-400 text-xs">{rowErrors.length} error(es) detectado(s)</span>
                  </div>
                  <ul className="space-y-0.5 max-h-32 overflow-y-auto pl-4 list-disc text-[11px] text-red-400">
                    {rowErrors.slice(0, 15).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {rowErrors.length > 15 && <li>... y {rowErrors.length - 15} errores más</li>}
                  </ul>
                </div>
              ) : (
                <div className={`rounded-xl border p-3 flex items-center gap-2.5 ${
                  theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'
                }`}>
                  <FaCheckCircle className="text-green-500 shrink-0" size={16} />
                  <p className="font-semibold text-green-500 text-xs">
                    Dataset validado con éxito. Se crearán los productos y los asientos iniciales en el Kardex valorizado.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Btn variant="secondary" fullWidth onClick={onClose}>Cancelar</Btn>
                <Btn
                  variant="primary"
                  fullWidth
                  disabled={hasErrors}
                  onClick={() => !hasErrors && setShowPwdModal(true)}
                  className="bg-yellow-500! text-black! hover:bg-yellow-400! font-bold"
                >
                  Importar y Asentar en Kardex
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`w-full max-w-xs rounded-2xl shadow-2xl p-5 flex flex-col gap-3 ${ds.cardBg} border`}>
            <h3 className="font-bold text-center text-sm">Confirmar Importación</h3>
            <p className={`text-xs text-center ${ds.muted}`}>
              Se importarán <strong>{rows.length}</strong> registros al catálogo. Confirma con tu contraseña.
            </p>
            {pwdError && <p className="text-red-400 text-xs text-center">{pwdError}</p>}
            <input
              type="password"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setPwdError(''); }}
              placeholder="Tu contraseña"
              autoFocus
              className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
            />
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" fullWidth onClick={() => { setShowPwdModal(false); setPwd(''); setPwdError(''); }}>
                Cancelar
              </Btn>
              <Btn variant="primary" size="sm" fullWidth onClick={handlePwdConfirm} className="bg-yellow-500! text-black! font-bold">
                Confirmar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportDatasetPanel;

