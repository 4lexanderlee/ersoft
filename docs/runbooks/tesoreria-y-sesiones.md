# Tesorería y sesiones de caja

## Archivos y arquitectura

- `frontend/src/components/treasury/TreasuryView.tsx`: contenedor, sucursal, tabs autorizadas y CTA contextual.
- `ReceivablesTab.tsx`, `PayablesTab.tsx`, `AccountsTab.tsx`, `PaymentModal.tsx`: cuentas, filtros, paginación y amortización.
- `ExpenseReportsTab.tsx`, `InitialBalanceTab.tsx`, `TreasuryKpis.tsx`: rendiciones, patrimonio y métricas autorizadas.
- `types.ts`, `treasuryRules.ts`, `legacy.ts`: contratos estrictos y adaptadores al Design System/contextos JavaScript existentes.
- `frontend/src/App.jsx`, Sidebar y Principal: ruta `/tesoreria`; `/rendiciones` redirige.
- `FinanzasContext.jsx`, `Caja.jsx`, `Ventas.jsx`, `cashSession.js`: validaciones, sincronización y acceso a caja.
- `rbacMatrix.js`: permisos separados por pestaña.
- `tsconfig.json`, `eslint.config.js`, `package.json`: compilación y revisión de TypeScript.

## Reglas operativas

MASTER y ADMINISTRADOR acceden a todas las pestañas; ADMINISTRADOR está limitado a su sucursal.
CAJERO solo consulta y abona CxC de su sucursal. ALMACENERO no accede.
El formulario recibe la cuenta completa, incluido ID, cliente, saldo actualizado y moneda.
Los abonos en efectivo requieren caja abierta propia y quedan vinculados a su sesión para el arqueo.
Los saldos se suman por moneda sin convertir ni mezclar PEN y USD.
El balance inicial permanece como patrimonio. El inventario inicial se gestiona mediante Inventario y Kardex.

## Alcance del bloqueo y requisito de producción

El repositorio usa autenticación simulada y localStorage. Estos mecanismos no son una frontera de seguridad.
Web Locks reserva una pestaña operativa por usuario dentro del mismo navegador/origen.
Cada caja exige usuario, sucursal y terminal coincidentes; una IP compartida no concede acceso.
El cierre libera el uso de ventas, pero la pestaña conserva su reserva hasta cerrarse o cerrar sesión.
Una pestaña en espera adquiere la reserva cuando la anterior se cierra.

En desarrollo y preview, Vite expone `GET /api/session/device` y devuelve la IP del socket HTTP.
En hosting estático este endpoint debe implementarse en la API: si falta, la interfaz muestra IP no disponible.
Detrás de un proxy solo se deben aceptar direcciones reenviadas por proxies explícitamente confiables.
La IP se utiliza para información y auditoría, no como identidad ni llave de exclusión.

**Pendiente para seguridad real entre dispositivos:** autenticar en servidor (por ejemplo Supabase Auth),
obtener el usuario del token verificado, aplicar RBAC/RLS en base de datos y adquirir la sesión
en una transacción con unicidad de turno abierto por usuario y caja/sucursal.
Apertura, emisión, abonos y cierre deben comprobar esa sesión en servidor.
Usar token de sesión, expiración/heartbeat y revocación; registrar IP observada por servidor en auditoría.
No desplegar el modo local como si implementara exclusión entre navegadores o dispositivos independientes.

## Verificación

Desde `frontend`:

- `npm run typecheck`
- `npm run test:treasury` (Node 22.18+ para ejecutar TypeScript sin emitir)
- `npm run build`
- Revisar en navegador MASTER → ADMINISTRADOR → CAJERO → ALMACENERO; no deben persistir pestañas ni modales privilegiados.
- Abrir caja → ventas habilitadas; cerrar caja → ventas bloqueadas.
- Abrir segunda pestaña con el mismo usuario → bloqueo hasta cerrar la pestaña dueña.
- Repetir abono, intentar exceder saldo y consultar arqueo.

Validación realizada en esta entrega: TypeScript estricto, ESLint de los archivos modificados,
cinco pruebas automatizadas y compilación Vite correctos. En navegador se verificaron las cuatro
identidades de rol, la redirección antigua, abono de S/ 50 con saldo y arqueo actualizados,
apertura/cierre habilitando/bloqueando ventas y bloqueo de una segunda pestaña del mismo usuario.
La instalación de dependencias reportó 26 vulnerabilidades en el árbol actual (2 bajas,
9 moderadas y 15 altas); no se aplicó una actualización masiva de dependencias.
