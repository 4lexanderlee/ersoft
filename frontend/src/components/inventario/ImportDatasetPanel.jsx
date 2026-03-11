import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { FaTimes, FaUpload, FaSearch, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

/**
 * Required columns and their indices (0-based):
 * 0: Lote | 1: Nombre | 2: Tipo | 3: Precio | 4: Cod Barras | 5: Dsct
 * 6: Vig Inicio | 7: Vig Fin | 8: categoría | 9: Imagen url | 10: Stock | 11: Descripción
 */
const COLUMNS = ['Lote', 'Nombre', 'Tipo', 'Precio', 'Cod Barras', 'Dsct', 'Vig Inicio', 'Vig Fin', 'categoría', 'Imagen url', 'Stock', 'Descripción'];
const REQUIRED_FOR_PRODUCTO = ['Nombre', 'Tipo', 'Precio', 'Lote', 'Stock'];
const REQUIRED_FOR_SERVICIO = ['Nombre', 'Tipo', 'Precio'];

const safeStr = (v) => (v == null ? '' : String(v).trim());

/**
 * Convierte un valor de fecha de Excel a formato ISO 'YYYY-MM-DD'.
 * Maneja: número serial de Excel, string en varios formatos o vacío.
 */
const parseExcelDate = (v) => {
  if (v == null || v === '') return '';

  // Caso 1: xlsx con cellDates:true devuelve un objeto Date nativo
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const s = String(v).trim();
  if (s === '') return '';

  // Caso 2: ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Caso 3: DD/MM/YYYY o D/M/YYYY (formato peruano / europeo)
  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Caso 4: DD-MM-YYYY con guiones
  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const [, d, m, y] = dmyDash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Caso 5: número serial de Excel
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
 * Validate a single row from the parsed sheet.
 * Returns array of error strings (empty means valid).
 */
const validateRow = (row, rowIndex, lotes, existingBarcodes) => {
  const errs = [];
  const tipo = safeStr(row['Tipo']).charAt(0).toUpperCase() + safeStr(row['Tipo']).slice(1).toLowerCase();

  if (!tipo || (tipo !== 'Producto' && tipo !== 'Servicio')) {
    errs.push(`Fila ${rowIndex}: Tipo inválido "${row['Tipo']}" (debe ser Producto o Servicio)`);
  }

  if (!safeStr(row['Nombre'])) errs.push(`Fila ${rowIndex}: Nombre es obligatorio`);
  if (!safeStr(row['Precio']) || isNaN(parseFloat(safeStr(row['Precio']))) || parseFloat(safeStr(row['Precio'])) < 0) {
    errs.push(`Fila ${rowIndex}: Precio inválido`);
  }

  if (tipo === 'Producto') {
    if (!safeStr(row['Lote'])) errs.push(`Fila ${rowIndex}: Lote es obligatorio para Productos`);
    else {
      const loteExists = lotes.some(l => l.nombre.trim().toLowerCase() === safeStr(row['Lote']).toLowerCase() && l.estado === 'Activo');
      if (!loteExists) errs.push(`Fila ${rowIndex}: Lote "${row['Lote']}" no existe o no está activo`);
    }
    const stock = safeStr(row['Stock']);
    if (stock !== '' && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
      errs.push(`Fila ${rowIndex}: Stock debe ser un número positivo`);
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
  const { login, user } = useAuth();
  const { lotes, productos, bulkImport } = useInventario();

  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]); // flat list of error strings
  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const fileRef = useRef(null);

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500';
  const thCls = theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600';
  const tdCls = theme === 'dark' ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-700';

  const existingBarcodes = new Set(
    productos.filter(p => p.codigoBarras).map(p => String(p.codigoBarras))
  );

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // cellDates:true hace que xlsx devuelva objetos Date para celdas de fecha.
        // raw:true (por defecto) mantiene los Date objects sin serializar a string.
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });

        if (raw.length < 2) {
          alert('El archivo está vacío o no tiene datos.');
          return;
        }

        // Map rows to objects. Date columns get normalised to YYYY-MM-DD via parseExcelDate.
        // Non-date fields are converted to string. rawVal is passed as-is to parseExcelDate
        // so it receives native Date objects (from xlsx cellDates:true) directly.
        const DATE_COLUMNS = new Set(['Vig Inicio', 'Vig Fin']);
        const dataRows = raw.slice(1).filter(r => r.some(c => c !== '' && c != null));
        const parsed = dataRows.map(r => {
          const obj = {};
          COLUMNS.forEach((col, idx) => {
            const rawVal = r[idx] != null ? r[idx] : '';
            if (DATE_COLUMNS.has(col)) {
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
          // Track barcodes seen in this file to catch duplicates within the file
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
    const r = login(user.username, pwd);
    if (!r.success) { setPwdError('Contraseña incorrecta'); return; }

    // Build final items to import
    const items = rows.map(row => {
      const tipo = safeStr(row['Tipo']).charAt(0).toUpperCase() + safeStr(row['Tipo']).slice(1).toLowerCase();
      const lote = lotes.find(l => l.nombre.trim().toLowerCase() === safeStr(row['Lote']).toLowerCase() && l.estado === 'Activo');
      const cats = safeStr(row['categoría']) ? safeStr(row['categoría']).split(',').map(c => c.trim()).filter(Boolean).slice(0, 3) : [];

      return {
        tipo,
        nombre: safeStr(row['Nombre']),
        precio: parseFloat(safeStr(row['Precio'])) || 0,
        codigoDsct: safeStr(row['Dsct']) || '',
        codigoBarras: safeStr(row['Cod Barras']) || null,
        vigenciaDesde: parseExcelDate(row['Vig Inicio']),
        vigenciaHasta: parseExcelDate(row['Vig Fin']),
        categorias: cats,
        imagen: safeStr(row['Imagen url']) || null,
        stock: tipo === 'Producto' ? (parseInt(safeStr(row['Stock'])) || 1) : undefined,
        descripcion: safeStr(row['Descripción']) || '',
        loteId: lote?.id || null,
      };
    });

    bulkImport(items);
    setShowPwdModal(false);
    onClose();
  };

  // Filtered preview rows — max 20 shown
  const filtered = rows
    .filter(r => !search || safeStr(r['Nombre']).toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  const hasErrors = rowErrors.length > 0;

  return (
    <>
      <div className={`h-full flex flex-col ${bg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`font-bold text-base italic ${text}`}>Importar Dataset (MASIVO)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {step === 'upload' && (
            <>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Sube un archivo <strong>CSV</strong> o <strong>XLSX</strong> con las columnas en el orden indicado:
              </p>
              <div className={`text-xs rounded-xl p-3 font-mono overflow-x-auto ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {COLUMNS.join(' | ')}
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-12 cursor-pointer transition-colors
                  ${theme === 'dark' ? 'border-gray-600 hover:border-yellow-500 hover:bg-yellow-500/5' : 'border-gray-300 hover:border-yellow-500 hover:bg-yellow-50'}`}
              >
                <FaUpload size={32} className="text-yellow-500 mb-3" />
                <p className={`font-semibold ${text}`}>Arrastra tu archivo aquí</p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>o haz clic para seleccionar (CSV / XLSX)</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </>
          )}

          {step === 'preview' && (
            <>
              {/* File info + re-upload */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold truncate max-w-[70%] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  📄 {fileName} — {rows.length} registros
                </span>
                <button
                  onClick={() => { setStep('upload'); setRows([]); setRowErrors([]); setFileName(''); }}
                  className="text-xs text-yellow-500 hover:text-yellow-400 underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Search */}
              <div className={`flex items-center gap-2 px-3 py-2 border rounded-full ${inputCls}`}>
                <FaSearch className="text-gray-400" size={12} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>

              {/* Preview table — first 20 */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr>
                      {COLUMNS.map(col => (
                        <th key={col} className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${thCls}`}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={COLUMNS.length} className={`px-3 py-4 text-center ${text}`}>Sin resultados</td></tr>
                    ) : filtered.map((row, i) => (
                      <tr key={i} className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                        {COLUMNS.map(col => (
                          <td key={col} className={`px-3 py-1.5 whitespace-nowrap max-w-[120px] truncate ${tdCls}`}>
                            {safeStr(row[col]) || <span className="opacity-30">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 20 && (
                <p className={`text-xs text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  Mostrando primeros 20 de {rows.length} registros
                </p>
              )}

              {/* Error / success section */}
              {hasErrors ? (
                <div className={`rounded-xl border p-4 space-y-2 ${theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="text-red-400" />
                    <span className="font-bold text-red-400 text-sm">{rowErrors.length} error(es) encontrado(s)</span>
                  </div>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {rowErrors.map((err, i) => (
                      <li key={i} className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>• {err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className={`rounded-xl border p-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'}`}>
                  <FaCheckCircle className="text-green-400 shrink-0" size={18} />
                  <p className="font-semibold text-green-400 text-sm">Todo en orden para subir al inventario ERSOFT</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-full font-bold text-sm border transition-colors
                    ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => !hasErrors && setShowPwdModal(true)}
                  disabled={hasErrors}
                  className="flex-1 py-3 rounded-full font-bold text-sm bg-yellow-500 hover:bg-yellow-400 text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aceptar e Importar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPwdModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`w-full max-w-xs rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="font-bold text-center">Confirmar importación</h3>
            <p className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Se importarán <strong>{rows.length}</strong> registros. Confirma con tu contraseña master.
            </p>
            {pwdError && <p className="text-red-400 text-sm text-center">{pwdError}</p>}
            <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setPwdError(''); }}
              placeholder="Contraseña del master" autoFocus
              className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputCls}`} />
            <div className="flex gap-3">
              <button onClick={() => { setShowPwdModal(false); setPwd(''); setPwdError(''); }}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button onClick={handlePwdConfirm}
                className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportDatasetPanel;
