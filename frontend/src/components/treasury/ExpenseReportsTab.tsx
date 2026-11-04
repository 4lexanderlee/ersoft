import RendicionesGastoPanel from '../rendiciones/RendicionesGastoPanel';
export default function ExpenseReportsTab({ branchId }: { branchId: string }) { return <RendicionesGastoPanel hideCreate branchId={branchId} />; }
