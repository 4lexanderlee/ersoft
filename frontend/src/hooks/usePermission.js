import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { RBAC_MATRIX } from '../data/rbacMatrix';

const normalizeRole = (role) => String(role || '').trim().toUpperCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Provides simulated RBAC checks and branch scope for the logged-in user. */
export const usePermission = () => {
  const { user } = useAuth();
  const rol = normalizeRole(user?.rol || user?.role);
  const roleConfig = RBAC_MATRIX[rol];

  const can = useCallback((modulo, accion) => {
    const aliases = { ventas: 'ventas_caja', caja: 'ventas_caja', promociones: 'ventas_caja', graficos: 'graficos_rendimiento', lotes: 'inventario' };
    const normalizedAction = String(accion || '').trim().toUpperCase();
    if (modulo === 'calendario') {
      return Boolean(
        roleConfig?.permissions?.calendario_global?.[normalizedAction]
        || roleConfig?.permissions?.calendario_sucursal?.[normalizedAction]
      );
    }
    return roleConfig?.permissions?.[aliases[modulo] || modulo]?.[normalizedAction] === true;
  }, [roleConfig]);

  return useMemo(() => ({
    can,
    isGlobalScope: roleConfig?.scope === 'GLOBAL',
    effectiveSucursalId: roleConfig?.scope === 'GLOBAL' ? null : (user?.sucursal_id ?? user?.sucursalId ?? null),
  }), [can, roleConfig?.scope, user?.sucursal_id, user?.sucursalId]);
};

export default usePermission;
