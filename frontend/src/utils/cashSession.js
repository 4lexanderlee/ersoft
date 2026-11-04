export const isOpenCashSession = session => ['ABIERTO', 'ABIERTA'].includes(String(session?.estado || '').toUpperCase());
export const findCashSession = (sessions, branchId) => sessions.find(session =>
  isOpenCashSession(session) && String(session.sucursalId ?? session.sucursal_id) === String(branchId)) || null;
export const canUseCashSession = (session, user, terminal, branchId) => Boolean(
  session && user && isOpenCashSession(session)
  && String(session.sucursalId ?? session.sucursal_id) === String(branchId)
  && (user.rol === 'MASTER' || String(user.sucursal_id ?? user.sucursalId) === String(branchId))
  && String(session.usuarioId) === String(user.id)
  && session.terminal_id && session.terminal_id === terminal?.terminal_id
);
