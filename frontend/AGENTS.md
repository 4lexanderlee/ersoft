# Contexto Acotado: Frontend (`frontend/`)

## 1. Reglas de UI y Design System (Obligatorio)
- **PROHIBIDO** instalar librerías de componentes externas (MUI, AntD, Chakra, Bootstrap) que rompan la estética actual.
- **USO OBLIGATORIO del Design System propio:** Consumir siempre el hook `src/hooks/useDS.js` y los componentes de `src/components/ui/` (`Btn.jsx`, `Card.jsx`, `Badge.jsx`, `Input.jsx`, `PageHeader.jsx`, `EmptyState.jsx`, `ThemeToggle.jsx`)[cite: 1, 2, 3].
- Todo componente nuevo (`CRM.jsx`, `Rendiciones.jsx`, `src/pages/empresa/Auditoria.jsx`) debe soportar **Modo Claro y Modo Oscuro** a través de `ThemeContext.jsx` y `useDS.js`[cite: 1, 2, 3].

## 2. Gestión de Estado y Permisos
- Respetar la separación de contextos en `src/context/`: `AuthContext.jsx`, `EmpresaContext.jsx`, `InventarioContext.jsx`, `FinanzasContext.jsx` (Caja/Rendiciones/CxC/CxP) y `CRMContext.jsx`[cite: 3].
- Proteger cada vista y botón de acción (`Transpasar`, `Anular Comprobante`, `Aprobar Rendición`, `Importar Dataset`) utilizando el hook `src/hooks/usePermission.js`[cite: 3].
- Usar `src/utils/clientValidations.js` para validar DNI (8 dígitos), CE (9 caracteres), RUC y RUS (11 dígitos)[cite: 1, 2, 3].