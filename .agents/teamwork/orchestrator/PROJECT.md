# Project: ERSOFT Catálogo, Kardex, Tesorería & RBAC (develop-v1)

## Architecture
- **Stack**: React 18 + Vite + Tailwind CSS (`frontend/`), FastAPI Python 3.11+ (`backend/`), Supabase PostgreSQL 15+.
- **Branch target**: `develop-v1` (merged to `master`, `dev1`)
- **Design System**: `frontend/src/theme/useDS.js`, `frontend/src/components/ui/` (`Card`, `Btn`, `Badge`, `Input`, etc.)
- **Track Isolation**:
  - **Track A (Catálogo & Kardex)**:
    - `frontend/src/context/InventarioContext.jsx`
    - `frontend/src/pages/Inventario.jsx`
    - `frontend/src/pages/Kardex.jsx`
    - `frontend/src/components/inventario/*`
  - **Track B (Tesorería, Caja, Seguridad de Terminal y RBAC)**:
    - `frontend/src/context/FinanzasContext.jsx`
    - `frontend/src/pages/Caja.jsx`
    - `frontend/src/pages/Rendiciones.jsx`
    - `frontend/src/components/rendiciones/*`
    - `frontend/src/pages/TBF.jsx`
    - `frontend/src/data/rbacMatrix.js`
    - `docs/rbac_matrix.json`
    - `frontend/src/pages/empresa/RolesPer.jsx`

## Feature Inventory
| # | Feature | Description | Milestone | Scope / Source |
|---|---------|-------------|-----------|----------------|
| 1 | Branch & Environment Setup | Ensure branch is `develop-v1`, check current git state | M0 | Setup (DONE) |
| 2 | Hierarchical Tree 3 levels | Familia -> Categoría -> Subcategoría with CRUD & SKU counts | M1 (Track A) | R2 (DONE) |
| 3 | Inventario Tab Navigation | Tabs: Catálogo de Ítems, Árbol de Familias y Categorías, Servicios | M1 (Track A) | R2 (DONE) |
| 4 | Decimal SUNAT Units | Units: NIU, KGM, MTR, LTR with `permite_decimales: true` | M1 (Track A) | R3 (DONE) |
| 5 | Variant Matrix | Size/Color matrix generating child SKUs, expandable rows | M1 (Track A) | R3 (DONE) |
| 6 | Pagination (25 items) | 25 items pagination in Inventario and Kardex with filters | M1 (Track A) | R4 (DONE) |
| 7 | Demand sorting (ventas_acumuladas) | `ventas_acumuladas` numeric attribute on products/services | M1 (Track A) | R4 (DONE) |
| 8 | Valorized Kardex Ledger | Complete valorized ledger with moving weighted average & balance | M1 (Track A) | R5 (DONE) |
| 9 | Manual Kardex Adjustment Modal | Restricted modal to adjust stock with immutable Kardex record | M1 (Track A) | R5 (DONE) |
| 10 | Dataset Importer Update | Import CSV/Excel with family, category, subcategory, size, color, unit | M1 (Track A) | R6 (DONE) |
| 11 | Terminal Fingerprinting | `terminal_id`, `ip_detectada`, `navegador_so` persistence | M2 (Track B) | R7 (DONE) |
| 12 | Terminal Lock in Cash Session | Binding `caja_sesion` to terminal & branch, simulation toggle, MASTER unlock | M2 (Track B) | R7 (DONE) |
| 13 | POS Gate `canOperatePOS` | Expose boolean in FinanzasContext gating POS on open cash & valid terminal | M2 (Track B) | R7 (DONE) |
| 14 | Manual CxP Creation Modal | Modal with RUC validation, advance payment, calendar due date event | M2 (Track B) | R8 (DONE) |
| 15 | RBAC Granular Matrix Sync | 5 new permissions synced across rbacMatrix.js, rbac_matrix.json, RolesPer.jsx | M2 (Track B) | R9 (DONE) |
| 16 | Treasury Pagination (25 items) | 25 items pagination in TBF.jsx and Rendiciones.jsx tables | M2 (Track B) | R9 (DONE) |
| 17 | Review, Integrity Audit & Build | Verification of zero errors (`npm run build`) and strict file isolation | M3 | Audit & QA (DONE) |
| 18 | Multi-branch Synchronization | Merge `develop-v1` into `master` and `dev1` cleanly | M4 | Git Merge (DONE) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Branch & Workspace Check | Verify/checkout `develop-v1` | None | DONE |
| M1 | Track A: Catálogo Logístico y Kardex | Features #2 - #10 (Agent 1) | M0 | DONE |
| M2 | Track B: Tesorería, Caja & RBAC | Features #11 - #16 (Agent 2) | M0 | DONE |
| M3 | Comprehensive Review & Audit | Build verification & forensic audit | M1, M2 | DONE |
| M4 | Final Branch Synchronization | Merge `develop-v1` to `master` and `dev1` | M3 | DONE |

## Interface Contracts & Isolation Rules
- **No overlapping files**:
  - Track A files: `frontend/src/context/InventarioContext.jsx`, `frontend/src/pages/Inventario.jsx`, `frontend/src/pages/Kardex.jsx`, `frontend/src/components/inventario/*`.
  - Track B files: `frontend/src/context/FinanzasContext.jsx`, `frontend/src/pages/Caja.jsx`, `frontend/src/pages/Rendiciones.jsx`, `frontend/src/components/rendiciones/*`, `frontend/src/pages/TBF.jsx`, `frontend/src/data/rbacMatrix.js`, `docs/rbac_matrix.json`, `frontend/src/pages/empresa/RolesPer.jsx`.
- **Style guide**: Both tracks strictly followed `useDS.js` and `components/ui/` design tokens.
- **Auditing**: Tablas inmutables Kardex Insert-Only (`RN-10`).
