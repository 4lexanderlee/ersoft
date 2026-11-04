---
name: ui-ersoft-component
description: Usa esta skill siempre que debas crear o modificar una página, modal o panel en React dentro de frontend/src/.
---
# Instrucciones para Crear Vistas en ERSOFT Frontend
1. Importa `useDS` desde `../hooks/useDS` y los átomos desde `../components/ui/` (`PageHeader`, `Card`, `Btn`, `Input`, `Badge`, `EmptyState`)[cite: 1, 2, 3].
2. Importa `usePermission` desde `../hooks/usePermission` para verificar si el rol actual (`MASTER`, `ADMINISTRADOR`, `CAJERO`, `ALMACENERO`) tiene alcance `GLOBAL` o `SUCURSAL` y permisos sobre la acción[cite: 3].
3. Si el usuario es `ADMINISTRADOR`, `CAJERO` o `ALMACENERO`, filtra por defecto los selectores de sede al `sucursal_id` del usuario logueado[cite: 3].
4. Mantén las validaciones de formularios sincronizadas con `src/utils/clientValidations.js`[cite: 1, 2, 3].