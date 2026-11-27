export const FINANCE_TABS = [
  { id: "receber", label: "Contas a Receber" },
  { id: "pagar", label: "Contas a Pagar" },
  { id: "fluxo", label: "Fluxo de Caixa" },
  { id: "relatorios", label: "Relatórios" },
] as const;

export type FinanceTabId = (typeof FINANCE_TABS)[number]["id"];
const STORAGE_KEY = "binotto-finance-tabs";

export function getFinanceTabs(): FinanceTabId[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!Array.isArray(saved)) return FINANCE_TABS.map(tab => tab.id);
    const valid = saved.filter((id): id is FinanceTabId => FINANCE_TABS.some(tab => tab.id === id));
    return [...new Set(valid), ...FINANCE_TABS.map(tab => tab.id).filter(id => !valid.includes(id))];
  } catch {
    return FINANCE_TABS.map(tab => tab.id);
  }
}

export function saveFinanceTabs(tabs: FinanceTabId[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}
