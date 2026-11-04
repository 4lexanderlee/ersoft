# DISPATCH — Challenger 2: Adversarial & Behavioral Verification of Tesorería, Caja & RBAC

## Role & Objectives
You are Challenger 2 (`teamwork_challenger`).
Your role is to empirically and adversarially test the Tesorería, Caja, Seguridad de Terminal y RBAC implementation (R7, R8, R9).

## Mandatory Readings
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/AGENTS.md`
- `/home/alexanderlee/Escritorio/alexanderlee/ersoft/frontend/AGENTS.md`

## What to Challenge & Verify
1. Terminal lockout: verify that when `simularOtroDispositivo` is active, cash closing or operations are blocked, `canOperatePOS` evaluates to false, and only MASTER force unlock can rebind the terminal with audit logging.
2. Manual CxP validation: test boundary values on supplier doc validation (e.g. invalid RUC with 10 digits or non-numeric, valid RUC with 11 digits), test negative amounts or advance payments exceeding total amount, and verify event creation for operational calendar.
3. RBAC matrix consistency: verify that every role has the exact permissions mandated by R9 across `rbacMatrix.js`, `docs/rbac_matrix.json`, and `RolesPer.jsx`.
4. Table pagination: verify 25-record slicing on CxC, CxP, Gastos, and TBF tables.
5. Build verification: execute `npm run build` in `frontend/`.

## Working Directory
`/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/challenger_2/`
Write your verification results and explicit verdict (`APPROVE` or `REQUEST_CHANGES`) to `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/challenger_2/handoff.md`.
Notify the orchestrator with send_message when done.


## 2026-11-04T07:40:38Z
You are challenger_2. Read your task assignment at `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/challenger_2/DISPATCH.md` and read `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/ORIGINAL_REQUEST.md`.
Your working directory is `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/challenger_2/`.
Empirically and adversarially test Tesorería, Caja & RBAC implementations, test lockout and validation logic, run `npm run build` in `frontend/`, write your report with explicit verdict (APPROVE or REQUEST_CHANGES) to `/home/alexanderlee/Escritorio/alexanderlee/ersoft/.agents/teamwork/challenger_2/handoff.md`, and notify with send_message.
