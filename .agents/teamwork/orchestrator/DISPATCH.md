## 2026-11-04T07:04:37Z

Run simultaneous agents on branch `develop-v1` (--agent-1 "argon-medium" for Catálogo Logístico y Kardex, --agent-2 "argon-flash" for Tesorería, Caja, Seguridad de Terminal y RBAC) to implement production-ready inventory and treasury features in ERSOFT, and merge the final changes into all branches upon completion.

Working directory: /home/alexanderlee/Escritorio/alexanderlee/ersoft
Integrity mode: development

## Requirements

### R1. Agent Scope & File Isolation Constraints
- Both agents must read `AGENTS.md` and `frontend/AGENTS.md` before implementing.
- Agent 1 (Catálogo Logístico y Kardex) must read `.agents/skills/ui-ersoft-component/SKILL.md` and touch ONLY:
  - `frontend/src/context/InventarioContext.jsx`
  - `frontend/src/pages/Inventario.jsx`
  - `frontend/src/pages/Kardex.jsx`
  - Paneles dentro de `frontend/src/components/inventario/`
  Must maintain 100% of the aesthetics of `useDS.js` and `components/ui/`.
- Agent 2 (Tesorería, Caja, Seguridad de Terminal y RBAC) must touch ONLY:
  - `frontend/src/context/FinanzasContext.jsx`
  - `frontend/src/pages/Caja.jsx`
  - `frontend/src/pages/Rendiciones.jsx`
  - `frontend/src/components/rendiciones/`
  - `frontend/src/pages/TBF.jsx`
  - `frontend/src/data/rbacMatrix.js`
  - `docs/rbac_matrix.json`
  - `frontend/src/pages/empresa/RolesPer.jsx`
  Must NOT touch `Inventario.jsx` nor `Ventas.jsx`. Must maintain design system aesthetics (`useDS.js`, `Card`, `Btn`, `Badge`, `Input`).

### R2. Catálogo Logístico: Estructura Jerárquica y Módulo Visual
- In `InventarioContext.jsx` and `AddCategoriasPanel.jsx`, evolve flat categories into a 3-level hierarchical tree: `Familia` (e.g. Textil y Moda, Calzado, Accesorios, Insumos), `Categoría` (e.g. Polos, Casacas, Pantalones), and `Subcategoría`.
- In `Inventario.jsx`, add an internal tab navigation bar to switch between:
  - `Catálogo de Ítems`
  - `Árbol de Familias y Categorías` (dedicated view with collapsible tree, SKU count per branch, and full CRUD)
  - `Servicios`

### R3. Catálogo Logístico: Productos con Variantes y Unidades por Peso/Fracción
- In `AddProductPanel.jsx` and `InventarioContext.jsx`, support two physical product types:
  1. `Producto Estándar / Por Peso`: allows selecting SUNAT Unit of Measure (`NIU` Unidad entera, `KGM` Kilogramo decimal, `MTR` Metro decimal, `LTR` Litro). If `KGM`, `MTR`, or `LTR`, activate `permite_decimales: true`.
  2. `Producto con Variantes (Matriz Talla / Color)`: allows adding multiple combinations (e.g., Size `S, M, L` and Color `Negro, Verde`), generating child SKUs with their own barcode, stock per warehouse/lot, and optional price/cost, grouped visually under the Parent Product in `Inventario.jsx` with an expandable row to inspect variant stock.

### R4. Catálogo Logístico: Límite de 25 Registros y Orden por Demanda
- Implement strict pagination of 25 records per page in `Inventario.jsx` and `Kardex.jsx`, including Prev/Next controls, "Mostrando 1-25 de X" indicator, and quick filters.
- Add numeric attribute `ventas_acumuladas` (demand) to each product/service so POS can query the Top 25 most sold items.

### R5. Catálogo Logístico: Kardex Valorizado Profesional
- In `Kardex.jsx`, display the official valorized general ledger with: Date/Time, SKU/Variant (Size/Color), Warehouse, Lot, Movement Type (`INVENTARIO_INICIAL`, `COMPRA`, `VENTA`, `TRASPASO_ENTRADA`, `TRASPASO_SALIDA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `ANULACION_VENTA`), Cantidad (`+` o `-`, supporting decimals for weight items), Unit Cost, Total Cost, Ending Physical Balance, Ending Weighted Average Cost, and Total Valorized Balance (S/).
- Add a modal for "Registrar Ajuste Manual de Kardex" (restricted by role permission) that updates stock and leaves an immutable record.

### R6. Catálogo Logístico: Actualización del Importador Masivo
- In `ImportDatasetPanel.jsx`, update the CSV/Excel parser and downloadable template to support optional columns: `FAMILIA`, `CATEGORIA`, `SUBCATEGORIA`, `TALLA`, `COLOR`, `UNIDAD_MEDIDA` (`NIU`, `KGM`, `MTR`, `ZZ`), automatically creating the initial `INVENTARIO_INICIAL` entry in the new valorized kardex.

### R7. Tesorería & Caja: Detección de Dispositivo / IP y Bloqueo de Terminal
- In `FinanzasContext.jsx` and `Caja.jsx`, generate and persist a terminal fingerprint (`terminal_id`, `ip_detectada` with simulated fallback `192.168.1.XX`, `navegador_so`) on session load.
- When opening cash in `Caja.jsx`, bind the active `caja_sesion` to `terminal_id`, `ip_detectada`, and `sucursal_id`.
- Add a terminal security panel in `Caja.jsx` displaying active IP and device, with a simulation toggle *"Simular acceso desde otro dispositivo/IP"* to block operating or closing cash from any different physical terminal (except force unlock by `MASTER`, recorded in `simulatedAudit.js`).
- Expose `canOperatePOS` boolean in `FinanzasContext` (true only if cash is `ABIERTA` in current branch AND `terminal_id`/IP matches active device).

### R8. Tesorería & Rendiciones: Creación Manual de Cuentas por Pagar (CxP)
- In `CxPPanel.jsx`, `CuentasPanel.jsx`, and `Rendiciones.jsx`, add primary button `"+ Nueva Cuenta por Pagar (Proveedor)"` opening a modal to register supplier obligations: RUC/Document (validated with `clientValidations.js`), Supplier Business Name, Concept/Supplier Invoice, Branch, Total Amount, optional Advance Payment (with Payment Method selector), Issue Date, and Due Date.
- Upon saving, update pending balance, record advance payment if present, and create a due date event in the operational calendar.

### R9. Seguridad & Permisos: Matriz RBAC y Paginación
- In `rbacMatrix.js`, `docs/rbac_matrix.json`, and `RolesPer.jsx`, add and sync granular permissions across roles (`MASTER`, `ADMINISTRADOR`, `CAJERO`, `ALMACENERO`):
  - `familias_categorias`: Full CRUD for Master/Admin/Almacenero, View for Cajero.
  - `cotizaciones_pos_crm`: Create and send quotes from Ventas to CRM (Master, Admin, Cajero).
  - `cuentas_por_pagar_crear`: Create CxP (Master, Admin).
  - `desbloquear_terminal_caja`: Only Master.
  - `reprogramar_calendario`: Master, Admin, Cajero (own CRM follow-ups only).
  Reflect toggles visually in `RolesPer.jsx`.
- In `TBF.jsx` and `Rendiciones.jsx` tables (CxC, CxP, Gastos), enforce clean pagination of 25 records per page.

### R10. Sincronización Final de Ramas
- Al finalizar la implementación y verificar la compilación limpia en `develop-v1`, realizar el merge de los cambios a todas las ramas del repositorio (incluyendo `master` y `dev1`).

## Verification Resources
- Build verification: `npm run build` in `frontend/` must complete with zero errors.
- Syntax and import integrity: all modified modules in `frontend/src/` must compile cleanly without missing imports or broken exports.
- Visual and UI conformance: all additions must adhere strictly to ERSOFT Design System tokens and primitives (`useDS.js`, `components/ui/`).
