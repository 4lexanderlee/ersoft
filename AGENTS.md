ERSOFT v1.1 — Contexto Maestro del Repositorio

## 1. Visión y Alcance del Sistema
ERP Comercial, POS, Rendiciones (CxC/CxP/Balance Inicial), Calendario Operativo y CRM Simple para PYMEs en Perú[cite: 3].
- **Arquitectura MVP:** Single-Tenant (una empresa matriz) con soporte **Multisucursal** y **Multialmacén**[cite: 3].
- **Stack Oficial:** Frontend en React 18 + Vite + Tailwind CSS (`frontend/`) | Backend en FastAPI Python 3.11+ (`backend/`) | Base de Datos en Supabase PostgreSQL 15+[cite: 3].
- **Fuente de Verdad Documental:** Consultar siempre `docs/architecture.md` antes de modificar reglas de negocio.

## 2. Reglas de Negocio Inquebrantables (CRÍTICO)
1. **Balance Inicial vs. Ingresos (`RN-01`):** El inventario inicial (`ejemplo.xlsx`) y la apertura de caja se registran como Balance Inicial / Patrimonio (`balance_inicial` y `INVENTARIO_INICIAL` en Kardex), NUNCA como ingresos de venta[cite: 3].
2. **Desglose Tributario IGV 18% (`RN-02`):** Todo precio gravado separa `subtotal_sin_igv = total / 1.18` e `igv = total - subtotal_sin_igv`. El IGV es pasivo para SUNAT, no ganancia[cite: 3].
3. **Devengo vs. Flujo de Caja (`RN-03`, `RN-04`):** Las ventas a crédito suman al Estado de Resultados (P&G) al emitirse, pero solo entran a Caja cuando se cobra la Cuenta por Cobrar (`cuenta_cobrar_pagar`)[cite: 3]. Las rendiciones aprobadas restan a la Utilidad Neta[cite: 3].
4. **Productos vs. Servicios (`RN-05`):** Los ítems tipo `SERVICIO` no usan lote, no usan almacén y NUNCA generan movimientos en `kardex_movimiento`[cite: 3].
5. **Kardex y Auditoría Inmutables (`RN-10`):** Las tablas `kardex_movimiento` y `auditoria_log` son estrictamente `INSERT-only`[cite: 3]. Prohibido implementar endpoints o botones de edición/borrado físico sobre ellas[cite: 3].
6. **Preparación SUNAT (`RN-08`, `RN-09`):** Soportar operación en modo `INTERNO_PRE_FORMALIZACION` (Notas de Venta `NV01`) y modo `SUNAT_PRODUCCION` (UBL 2.1)[cite: 3]. Exigir RUC (11 dígitos) en Facturas y exigir DNI/identificación obligatoria en Boletas mayores a S/ 700.00[cite: 3].

## 3. Convenciones de Código y Seguridad
- **RBAC de 4 Roles:** `MASTER` (Alcance `GLOBAL`), `ADMINISTRADOR` (Alcance `SUCURSAL`), `CAJERO` (POS/Caja/CRM operativo en su sede), `ALMACENERO` (Logística/Kardex/Lotes en su sede)[cite: 3].
- Toda acción sensible debe registrar un evento en `auditoria_log` con `datos_previos_json` y `datos_nuevos_json`[cite: 3].