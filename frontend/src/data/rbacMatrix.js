export const PERMISSION_ACTIONS = ['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'TRANSPASAR', 'ANULAR', 'APROBAR_RENDICION'];

const toGranularPermissions = (allowedByModule) => Object.fromEntries(
  Object.entries(allowedByModule).map(([module, allowedActions]) => [
    module,
    Object.fromEntries(PERMISSION_ACTIONS.map(action => [action, allowedActions.includes(action)])),
  ]),
);

const defineRole = (scope, permissions) => ({ scope, permissions: toGranularPermissions(permissions) });

export const RBAC_MATRIX = {
  MASTER: defineRole('GLOBAL', { perfil: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], clientes: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], crm: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], calendario_global: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], calendario_sucursal: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], ventas_caja: ['VER', 'CREAR', 'EDITAR', 'ANULAR'], rendiciones_cxc_cxp: ['VER', 'CREAR', 'EDITAR', 'ANULAR', 'APROBAR_RENDICION'], graficos_rendimiento: ['VER'], tbf: ['VER', 'CREAR', 'EDITAR', 'ANULAR'], inventario: ['VER', 'CREAR', 'EDITAR', 'TRANSPASAR', 'ANULAR'], empresa: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], auditoria: ['VER'] }),
  ADMINISTRADOR: defineRole('SUCURSAL', { perfil: ['VER', 'EDITAR'], clientes: ['VER', 'CREAR', 'EDITAR'], crm: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], calendario_global: ['VER'], calendario_sucursal: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'], ventas_caja: ['VER', 'CREAR', 'EDITAR', 'ANULAR'], rendiciones_cxc_cxp: ['VER', 'CREAR', 'EDITAR', 'ANULAR', 'APROBAR_RENDICION'], graficos_rendimiento: ['VER'], tbf: ['VER', 'CREAR', 'EDITAR', 'ANULAR'], inventario: ['VER', 'CREAR', 'EDITAR', 'TRANSPASAR', 'ANULAR'], empresa: ['VER', 'CREAR', 'EDITAR'], auditoria: ['VER'] }),
  CAJERO: defineRole('SUCURSAL', { perfil: ['VER', 'EDITAR'], clientes: ['VER', 'CREAR', 'EDITAR'], crm: ['VER', 'CREAR', 'EDITAR'], calendario_global: ['VER'], calendario_sucursal: ['VER', 'CREAR', 'EDITAR'], ventas_caja: ['VER', 'CREAR', 'EDITAR'], rendiciones_cxc_cxp: ['VER', 'CREAR'], graficos_rendimiento: [], tbf: ['VER', 'CREAR'], inventario: ['VER'], empresa: [], auditoria: [] }),
  ALMACENERO: defineRole('SUCURSAL', { perfil: ['VER', 'EDITAR'], clientes: [], crm: [], calendario_global: ['VER'], calendario_sucursal: ['VER', 'CREAR', 'EDITAR'], ventas_caja: [], rendiciones_cxc_cxp: [], graficos_rendimiento: [], tbf: [], inventario: ['VER', 'CREAR', 'EDITAR', 'TRANSPASAR'], empresa: [], auditoria: [] }),
};

export const INVENTORY_RESOURCES = ['kardex', 'almacenes', 'lotes', 'producto', 'servicio', 'categorias', 'importar_dataset'];

export default RBAC_MATRIX;
