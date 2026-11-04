# DISPATCH — Track B: Tesorería, Caja, Seguridad de Terminal y RBAC

## Role & Objectives
You are Agent 2 (Tesorería, Caja, Seguridad de Terminal y RBAC).
You must implement production-ready treasury, terminal security, and RBAC features in ERSOFT on branch `develop-v1`.

## Mandatory Reading & Guidelines
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/ORIGINAL_REQUEST.md`
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/AGENTS.md`
- Read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/frontend/AGENTS.md`

## Strict File Isolation Constraints
You must touch ONLY the following files:
- `frontend/src/context/FinanzasContext.jsx`
- `frontend/src/pages/Caja.jsx`
- `frontend/src/pages/Rendiciones.jsx`
- `frontend/src/components/rendiciones/*` (e.g. `CxPPanel.jsx`, `CuentasPanel.jsx`, etc.)
- `frontend/src/pages/TBF.jsx`
- `frontend/src/data/rbacMatrix.js`
- `docs/rbac_matrix.json`
- `frontend/src/pages/empresa/RolesPer.jsx`
DO NOT touch `Inventario.jsx` nor `Ventas.jsx`. DO NOT touch any file outside this designated list.
Must maintain design system aesthetics (`useDS.js`, `Card`, `Btn`, `Badge`, `Input`).

## Detailed Requirements to Implement
1. **R7. Tesorería & Caja: Detección de Dispositivo / IP y Bloqueo de Terminal**:
   - In `FinanzasContext.jsx` and `Caja.jsx`, generate and persist a terminal fingerprint (`terminal_id`, `ip_detectada` with simulated fallback `192.168.1.XX`, `navegador_so`) on session load.
   - When opening cash in `Caja.jsx`, bind the active `caja_sesion` to `terminal_id`, `ip_detectada`, and `sucursal_id`.
   - Add a terminal security panel in `Caja.jsx` displaying active IP and device, with a simulation toggle *"Simular acceso desde otro dispositivo/IP"* to block operating or closing cash from any different physical terminal (except force unlock by `MASTER`, recorded in `simulatedAudit.js`).
   - Expose `canOperatePOS` boolean in `FinanzasContext` (true only if cash is `ABIERTA` in current branch AND `terminal_id`/IP matches active device).
2. **R8. Tesorería & Rendiciones: Creación Manual de Cuentas por Pagar (CxP)**:
   - In `CxPPanel.jsx`, `CuentasPanel.jsx`, and `Rendiciones.jsx`, add primary button `"+ Nueva Cuenta por Pagar (Proveedor)"` opening a modal to register supplier obligations: RUC/Document (validated with `clientValidations.js`), Supplier Business Name, Concept/Supplier Invoice, Branch, Total Amount, optional Advance Payment (with Payment Method selector), Issue Date, and Due Date.
   - Upon saving, update pending balance, record advance payment if present, and create a due date event in the operational calendar.
3. **R9. Seguridad & Permisos: Matriz RBAC y Paginación**:
   - In `rbacMatrix.js`, `docs/rbac_matrix.json`, and `RolesPer.jsx`, add and sync granular permissions across roles (`MASTER`, `ADMINISTRADOR`, `CAJERO`, `ALMACENERO`):
     - `familias_categorias`: Full CRUD for Master/Admin/Almacenero, View for Cajero.
     - `cotizaciones_pos_crm`: Create and send quotes from Ventas to CRM (Master, Admin, Cajero).
     - `cuentas_por_pagar_crear`: Create CxP (Master, Admin).
     - `desbloquear_terminal_caja`: Only Master.
     - `reprogramar_calendario`: Master, Admin, Cajero (own CRM follow-ups only).
     Reflect toggles visually in `RolesPer.jsx`.
   - In `TBF.jsx` and `Rendiciones.jsx` tables (CxC, CxP, Gastos), enforce clean pagination of 25 records per page.

## Verification
- Run `npm run build` in `frontend/` and ensure 0 compilation/bundling errors.
- Confirm only files within your designated scope were modified.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Working Directory
`/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/worker_track_b/`
Deliver `handoff.md` and report back via send_message.
