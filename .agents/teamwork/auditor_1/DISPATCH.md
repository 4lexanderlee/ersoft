# DISPATCH — Forensic Auditor: Integrity & Anti-Cheating Verification

## Role & Objectives
You are the Forensic Auditor (`teamwork_auditor`).
Your role is to perform strict, independent forensic integrity verification of ALL implementations delivered by `worker_track_a` and `worker_track_b`.

## Mandatory Readings
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/AGENTS.md`
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/frontend/AGENTS.md`
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/worker_track_a/handoff.md`
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/worker_track_b/handoff.md`

## Forensic Verification Checks
1. **File Isolation Integrity Check**:
   - Verify that Track A touched ONLY: `frontend/src/context/InventarioContext.jsx`, `frontend/src/pages/Inventario.jsx`, `frontend/src/pages/Kardex.jsx`, `frontend/src/components/inventario/*`.
   - Verify that Track B touched ONLY: `frontend/src/context/FinanzasContext.jsx`, `frontend/src/pages/Caja.jsx`, `frontend/src/pages/Rendiciones.jsx`, `frontend/src/components/rendiciones/*`, `frontend/src/pages/TBF.jsx`, `frontend/src/data/rbacMatrix.js`, `docs/rbac_matrix.json`, `frontend/src/pages/empresa/RolesPer.jsx`.
   - Ensure NO modifications were made to `Ventas.jsx` or any other out-of-scope files.
2. **Anti-Cheating & Authenticity Check**:
   - Check that implementations are genuine and not hardcoded dummies, mocks, or facades.
   - Verify that the 3-level hierarchy tree (Familia, Categoría, Subcategoría) has genuine recursive/nested data models and active CRUD handlers.
   - Verify that the variant matrix generator produces real Cartesian combinations and dynamic parent stock summation.
   - Verify that the valorized Kardex executes genuine moving weighted average math and persists immutable movements.
   - Verify that terminal fingerprinting and lock logic in Caja and Finanzas actually blocks operations when mismatched.
   - Verify that manual CxP performs genuine tax document validation and writes to the calendar event store.
3. **Build & Syntax Verification**:
   - Execute `npm run build` in `frontend/` to ensure zero compilation or bundling errors.

## Working Directory
`/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/auditor_1/`
Write your forensic evidence report and binary verdict (`CLEAN` or `INTEGRITY VIOLATION`) to `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/auditor_1/handoff.md`.
Notify the orchestrator with send_message when done.

## 2026-11-04T07:40:51Z
You are auditor_1 (Forensic Auditor). Read your task assignment at `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/auditor_1/DISPATCH.md` and read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/ORIGINAL_REQUEST.md`.
Your working directory is `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/auditor_1/`.
Conduct forensic integrity checks on file isolation, genuine implementation logic (no dummy facades or hardcoded bypasses), run `npm run build` in `frontend/`, write your report with explicit binary verdict (CLEAN or INTEGRITY VIOLATION) to `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/auditor_1/handoff.md`, and notify with send_message.
