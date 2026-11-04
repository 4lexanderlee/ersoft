# DISPATCH — Track A: Catálogo Logístico y Kardex

## Role & Objectives
You are Agent 1 (Catálogo Logístico y Kardex).
You must implement production-ready inventory and catalog features in ERSOFT on branch `develop-v1`.

## Mandatory Reading & Guidelines
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/ORIGINAL_REQUEST.md`
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/AGENTS.md`
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/frontend/AGENTS.md`
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/skills/ui-ersoft-component/SKILL.md`

## Strict File Isolation Constraints
You must touch ONLY the following files:
- `frontend/src/context/InventarioContext.jsx`
- `frontend/src/pages/Inventario.jsx`
- `frontend/src/pages/Kardex.jsx`
- Paneles dentro de `frontend/src/components/inventario/` (e.g. `AddProductPanel.jsx`, `AddCategoriasPanel.jsx`, `ImportDatasetPanel.jsx`, etc.)
DO NOT TOUCH ANY OTHER FILES.
Maintain 100% of the aesthetics of `useDS.js` and `components/ui/` (`Card`, `Btn`, `Badge`, `Input`, etc.).

## Detailed Requirements to Implement
1. **R2. Estructura Jerárquica y Módulo Visual**:
   - In `InventarioContext.jsx` and `AddCategoriasPanel.jsx`, evolve flat categories into a 3-level hierarchical tree: `Familia` (e.g. Textil y Moda, Calzado, Accesorios, Insumos), `Categoría` (e.g. Polos, Casacas, Pantalones), and `Subcategoría`.
   - In `Inventario.jsx`, add an internal tab navigation bar to switch between:
     - `Catálogo de Ítems`
     - `Árbol de Familias y Categorías` (dedicated view with collapsible tree, SKU count per branch, and full CRUD)
     - `Servicios`
2. **R3. Productos con Variantes y Unidades por Peso/Fracción**:
   - In `AddProductPanel.jsx` and `InventarioContext.jsx`, support two physical product types:
     1. `Producto Estándar / Por Peso`: allows selecting SUNAT Unit of Measure (`NIU` Unidad entera, `KGM` Kilogramo decimal, `MTR` Metro decimal, `LTR` Litro). If `KGM`, `MTR`, or `LTR`, activate `permite_decimales: true`.
     2. `Producto con Variantes (Matriz Talla / Color)`: allows adding multiple combinations (e.g., Size `S, M, L` and Color `Negro, Verde`), generating child SKUs with their own barcode, stock per warehouse/lot, and optional price/cost, grouped visually under the Parent Product in `Inventario.jsx` with an expandable row to inspect variant stock.
3. **R4. Límite de 25 Registros y Orden por Demanda**:
   - Implement strict pagination of 25 records per page in `Inventario.jsx` and `Kardex.jsx`, including Prev/Next controls, "Mostrando 1-25 de X" indicator, and quick filters.
   - Add numeric attribute `ventas_acumuladas` (demand) to each product/service so POS can query the Top 25 most sold items.
4. **R5. Kardex Valorizado Profesional**:
   - In `Kardex.jsx`, display the official valorized general ledger with: Date/Time, SKU/Variant (Size/Color), Warehouse, Lot, Movement Type (`INVENTARIO_INICIAL`, `COMPRA`, `VENTA`, `TRASPASO_ENTRADA`, `TRASPASO_SALIDA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `ANULACION_VENTA`), Cantidad (`+` o `-`, supporting decimals for weight items), Unit Cost, Total Cost, Ending Physical Balance, Ending Weighted Average Cost, and Total Valorized Balance (S/).
   - Add a modal for "Registrar Ajuste Manual de Kardex" (restricted by role permission) that updates stock and leaves an immutable record.
5. **R6. Actualización del Importador Masivo**:
   - In `ImportDatasetPanel.jsx`, update the CSV/Excel parser and downloadable template to support optional columns: `FAMILIA`, `CATEGORIA`, `SUBCATEGORIA`, `TALLA`, `COLOR`, `UNIDAD_MEDIDA` (`NIU`, `KGM`, `MTR`, `ZZ`), automatically creating the initial `INVENTARIO_INICIAL` entry in the new valorized kardex.

## Verification
- Run `npm run build` in `frontend/` and ensure 0 compilation/bundling errors.
- Confirm only files within your designated scope were modified.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Working Directory
`/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/worker_track_a/`
Deliver `handoff.md` and report back via send_message.
