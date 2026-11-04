import type { Account, AccountStatus, Currency } from './types';
export const money = (value: number, currency: Currency = 'PEN'): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value);
export const today = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const accountStatus = (account: Account, date = today()): AccountStatus => {
  if (account.estado === 'ANULADO') return 'ANULADO';
  if (Number(account.saldo_pendiente) <= 0) return 'PAGADO';
  if (account.fecha_vencimiento < date) return 'VENCIDO';
  return Number(account.monto_pagado) > 0 ? 'PARCIAL' : 'PENDIENTE';
};
export const statusColor: Record<AccountStatus, string> = { PENDIENTE: 'amber', PARCIAL: 'blue', PAGADO: 'green', VENCIDO: 'red', ANULADO: 'gray' };
export const totalBalance = (accounts: Account[]): number => accounts.reduce((sum, account) => sum + Math.round(Number(account.saldo_pendiente) * 100), 0) / 100;
