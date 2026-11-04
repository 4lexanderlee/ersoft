import AccountsTab from './AccountsTab';
import type { AccountPayable } from './types';
export default function PayablesTab({ accounts, onPayment }: { accounts: AccountPayable[]; onPayment: (account: AccountPayable) => void }) {
  return <AccountsTab accounts={accounts} onPayment={account => { if (account.tipo === 'POR_PAGAR') onPayment({ ...account, tipo: 'POR_PAGAR' }); }} />;
}
