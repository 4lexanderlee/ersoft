# BRIEFING — 2026-11-04T07:35:00Z

## Mission
Implement production-ready treasury, terminal security, CxP manual creation with calendar sync, RBAC matrix extension, and pagination in ERSOFT.

## 🔒 My Identity
- Archetype: worker_track_b
- Roles: implementer, qa, specialist
- Working directory: /home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/worker_track_b
- Original parent: 0953346b-6831-4c3e-a381-d43ace8b36bc
- Milestone: Tesorería, Caja, Seguridad de Terminal y RBAC

## 🔒 Key Constraints
- Touch ONLY:
  - frontend/src/context/FinanzasContext.jsx
  - frontend/src/pages/Caja.jsx
  - frontend/src/pages/Rendiciones.jsx
  - frontend/src/components/rendiciones/ (e.g. CxPPanel.jsx, CuentasPanel.jsx, etc.)
  - frontend/src/pages/TBF.jsx
  - frontend/src/data/rbacMatrix.js
  - docs/rbac_matrix.json
  - frontend/src/pages/empresa/RolesPer.jsx
- DO NOT touch Inventario.jsx nor Ventas.jsx.
- Maintain 100% of the aesthetics of useDS.js, Card, Btn, Badge, Input.
- Verify work with npm run build in frontend/.

## Current Parent
- Conversation ID: 0953346b-6831-4c3e-a381-d43ace8b36bc
- Updated: 2026-11-04T07:35:00Z

## Task Summary
- **What to build**: Production-ready treasury, terminal security, CxP manual creation with calendar sync, RBAC matrix extension with visual sync, and 25-record pagination in TBF and Rendiciones.
- **Success criteria**:
  1. Terminal fingerprint (terminal_id, ip_detectada, navegador_so) generated and bound to caja_sesion on open. Simulation toggle in Caja blocks operation/closure if terminal mismatch, with MASTER force-unlock audit.
  2. canOperatePOS boolean exposed in FinanzasContext (true only if cash is ABIERTA in current branch and terminal_id/ip matches active device).
  3. CxP creation modal in Rendiciones / CxPPanel / CuentasPanel validating supplier document, recording obligations with optional advance payment, updating balance, and registering calendar due date event.
  4. RBAC matrix extended with granular permissions (`familias_categorias`, `cotizaciones_pos_crm`, `cuentas_por_pagar_crear`, `desbloquear_terminal_caja`, `reprogramar_calendario`) synced across rbacMatrix.js, docs/rbac_matrix.json, and RolesPer.jsx.
  5. Strict pagination of 25 records per page in TBF.jsx and Rendiciones.jsx tables.
  6. Frontend builds cleanly (`npm run build`) with zero errors.
- **Interface contracts**: PROJECT.md / AGENTS.md
- **Code layout**: frontend/src/

## Change Tracker
- **Files modified**:
  - `frontend/src/context/FinanzasContext.jsx`: Device fingerprinting, simulation toggle, canOperatePOS, isTerminalBlocked, master force-unlock with audit.
  - `frontend/src/pages/Caja.jsx`: Session binding to terminal on open, security card, blocked UI, master force unlock, history terminal column.
  - `frontend/src/components/rendiciones/NuevaCxPModal.jsx`: New modal with clientValidations, advance payment, FinanzasContext and calendar sync.
  - `frontend/src/components/rendiciones/CuentasPanel.jsx`: Button "+ Nueva Cuenta por Pagar", modal integration, 25-row pagination.
  - `frontend/src/pages/Rendiciones.jsx`: Header button "+ Nueva Cuenta por Pagar", modal integration.
  - `frontend/src/components/rendiciones/RendicionesGastoPanel.jsx`: 25-row pagination with navigation controls.
  - `frontend/src/pages/TBF.jsx`: 25-row pagination for comprobantes table with page reset on filtering.
  - `frontend/src/data/rbacMatrix.js`: 5 granular permissions added across MASTER, ADMINISTRADOR, CAJERO, ALMACENERO.
  - `docs/rbac_matrix.json`: 5 granular permissions added with full boolean action maps.
  - `frontend/src/pages/empresa/RolesPer.jsx`: DEFAULT_ROLES_PERMISOS and MODULE_LABELS updated with the 5 new granular permissions.
- **Build status**: `cd frontend && npm run build` -> EXIT 0 (built in 2.15s).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Passing (`npm run build` exits with code 0).
- **Lint status**: 0 violations.
- **Tests added/modified**: Verified through build and end-to-end integration contracts.

## Loaded Skills
- **Source**: /home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/skills/ui-ersoft-component/SKILL.md
- **Local copy**: /home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/skills/ui-ersoft-component/SKILL.md
- **Core methodology**: UI components must consume useDS, UI atoms (Btn, Card, Badge, Input, etc.), respect usePermission and clientValidations.

## Key Decisions Made
- Used localStorage persistence with synchronized storage events for terminal fingerprinting and simulation toggle.
- Enforced strict supplier validation with `validateDocNumber` and `sanitizeDocNumber` from `clientValidations.js`.
- Preserved complete UI atom aesthetic consistency across dark and light themes.

## Artifact Index
- DISPATCH.md — assignment details
- BRIEFING.md — persistent working memory
- progress.md — liveness heartbeat
- handoff.md — 5-part self-contained completion handoff report
