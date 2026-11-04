export type Role = 'MASTER' | 'ADMINISTRADOR' | 'CAJERO' | 'ALMACENERO';
export type Id = string | number;
export type Currency = 'PEN' | 'USD';
export type AccountStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO' | 'ANULADO';
export interface Payment { id: Id; fecha: string; monto: number; metodo_pago: string; referencia: string; usuario: string; caja_id?: Id }
export interface Account {
  id: Id; tipo: 'POR_COBRAR' | 'POR_PAGAR'; cliente_proveedor_nombre: string;
  comprobante_referencia: string; concepto: string; sucursal_id: Id;
  monto_total: number; monto_pagado: number; saldo_pendiente: number; moneda: Currency;
  fecha_emision: string; fecha_vencimiento: string; estado: AccountStatus; abonos: Payment[];
}
export interface AccountReceivable extends Account { tipo: 'POR_COBRAR' }
export interface AccountPayable extends Account { tipo: 'POR_PAGAR' }
export interface ExpenseReport {
  id: Id; sucursal_id: Id; concepto: string; categoria: string; monto: number;
  estado: 'PENDIENTE_APROBACION' | 'APROBADO' | 'RECHAZADO'; usuario_responsable: string;
  fecha_solicitud: string; subtotal_sin_igv: number; monto_igv: number;
}
export interface InitialBalance { id: Id; sucursal_id: Id; tipo: 'CAPITAL_CAJA' | 'CAPITAL_BANCO' | 'INVENTARIO_APERTURA'; monto: number; concepto: string; fecha: string; moneda?: Currency }
export interface PaymentInput { monto: number; metodoPago: string; referencia: string; usuario: string }
export interface TreasuryContext {
  cuentasCobrarPagar: Account[]; rendicionesGastos: ExpenseReport[]; balancesIniciales: InitialBalance[];
  registrarAbonoCuenta: (id: Id, data: PaymentInput) => Account;
  addBalanceInicial: (data: Omit<InitialBalance, 'id'> & { usuario_registro: string; referencia: string }) => InitialBalance;
  refreshFinanzas: () => void;
}
export type TreasuryTab = 'cxc' | 'cxp' | 'gastos' | 'balance' | 'pnl';
export const tabModule: Record<TreasuryTab, string> = { cxc: 'tesoreria_cxc', cxp: 'tesoreria_cxp', gastos: 'tesoreria_gastos', balance: 'tesoreria_balance', pnl: 'estado_resultados' };
