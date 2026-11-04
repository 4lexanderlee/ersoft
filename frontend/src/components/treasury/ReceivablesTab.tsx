import AccountsTab from './AccountsTab';
import type { AccountReceivable } from './types';
export default function ReceivablesTab({ accounts, onPayment }: { accounts: AccountReceivable[]; onPayment: (account: AccountReceivable) => void }) {
  return <AccountsTab accounts={accounts} onPayment={account => { if (account.tipo === 'POR_COBRAR') onPayment({ ...account, tipo: 'POR_COBRAR' }); }} />;
}
