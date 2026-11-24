import { toast } from "sonner";
import { FINANCE_COLUMNS, PAYABLE_COLUMNS, PERICIA_COLUMNS, getTableColumns } from "@/constants/tablePreferences";
import { GripVertical } from "lucide-react";
import { getServiceColumns, getVehicleReference, saveServiceColumns, saveVehicleReference, SERVICE_COLUMNS, type ServiceColumn, type ColumnPreference } from "@/constants/servicePreferences";
import { AdminHistory } from "./AdminHistory";
import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

import { Button } from "@/components/ui/button";
import { getServiceVehicleView, saveServiceVehicleView } from "@/constants/serviceVehicleView";

const sections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "usuario", label: "Usuário" },
  { id: "servico", label: "Serviço" },
  { id: "pericias", label: "Perícias" },
  { id: "financeiro", label: "Financeiro" },
  { id: "administradores", label: "Administradores" },
  { id: "coeficientes", label: "Coeficientes" },
  { id: "historico", label: "Histórico" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function TableDisplaySettings<T extends string>({ storageKey, labels, group }: { storageKey: string; labels: Record<T, string>; group?: { parent: T; child: T } }) {
  const [visible, setVisible] = useState(() => getTableColumns(storageKey, labels));
  const [order, setOrder] = useState(() => [...visible, ...(Object.keys(labels) as T[]).filter(id => !visible.includes(id))]);
  const draggedColumn = useRef<T | null>(null);
  const rows = order.filter(id => id !== group?.child);
  function persist(nextOrder: T[], nextVisible: T[]) {
    localStorage.setItem(storageKey, JSON.stringify(nextOrder.filter(id => nextVisible.includes(id))));
    setOrder(nextOrder);
    setVisible(nextVisible);
  }

  function move(id: T, target: number) {
    if (target < 0 || target >= rows.length) return;
    const next = rows.filter(column => column !== id);
    next.splice(target, 0, id);
    if (group) next.splice(next.indexOf(group.parent) + 1, 0, group.child);
    persist(next, visible);
  }

  return <div className="space-y-3">
    <h2 className="font-semibold">Mostrador da tela principal</h2>
    <ul className="max-w-lg divide-y rounded-lg border">
      {rows.map((id, index) => <li key={id} className="flex items-center justify-between gap-2 px-3 py-1"
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          if (draggedColumn.current !== null) move(draggedColumn.current, index);
          draggedColumn.current = null;
        }}>
        <label className="flex flex-1 items-center gap-2">
          <input type="checkbox" checked={visible.includes(id)} onChange={event =>
            persist(order, event.target.checked ? [...visible, id] : visible.filter(column => column !== id))} />
          {labels[id]}
        </label>
        {group && id === group.parent && <label className="flex items-center gap-2">
          <input type="checkbox" checked={visible.includes(group.child)} onChange={event =>
            persist(order, event.target.checked ? [...visible, group.child] : visible.filter(column => column !== group.child))} />
          {labels[group.child]}
        </label>}
        <Button variant="ghost" size="icon" draggable className="cursor-grab" aria-label={`Reordenar ${labels[id]}`}
          onDragStart={event => { draggedColumn.current = id; event.dataTransfer.setData("text/plain", id); }}
          onDragEnd={() => { draggedColumn.current = null; }}
          onKeyDown={event => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            move(id, index + (event.key === "ArrowUp" ? -1 : 1));
          }}><GripVertical className="size-4" /></Button>
      </li>)}
    </ul>
  </div>;
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

  const [vehicleView, setVehicleView] = useState(getServiceVehicleView);

  const [reference, setReference] = useState<"placa" | "chassi" | "ambos" | null>(null);
  const [savingReference, setSavingReference] = useState(false);
  useEffect(() => {
    getVehicleReference().then(setReference).catch(() => toast.error("Não foi possível carregar a referência do carro."));
  }, []);
  const [columns, setColumns] = useState(getServiceColumns);
  const dragged = useRef<ServiceColumn | null>(null);

  function updateColumns(next: ColumnPreference[]) {
    setColumns(next);
    saveServiceColumns(next);
  }

  function moveColumn(id: ServiceColumn, target: number) {
    const index = columns.findIndex(column => column.id === id);
    if (index < 0 || target < 0 || target >= columns.length || index === target) return;
    const next = [...columns];
    next.splice(target, 0, ...next.splice(index, 1));
    updateColumns(next);
  }

  return (
    <AppLayout title="Configurações" subtitle="Preferências do painel administrativo">
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card p-2">
        <nav aria-label="Seções de configurações" className="flex min-w-max items-center gap-2">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              aria-current={activeSection === id ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                activeSection === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <section
        aria-label={sections.find(({ id }) => id === activeSection)?.label}
        className="mt-5 min-h-[380px] rounded-xl border border-border bg-card p-5"
      >
        {activeSection === "financeiro" && <div className="grid gap-6 lg:grid-cols-2">
          <section><h2 className="mb-3 text-lg font-semibold">Contas a receber</h2><TableDisplaySettings storageKey="binotto-finance-columns" labels={FINANCE_COLUMNS} group={{ parent: "value", child: "vat" }} /></section>
          <section><h2 className="mb-3 text-lg font-semibold">Contas a pagar</h2><TableDisplaySettings storageKey="binotto-payable-columns" labels={PAYABLE_COLUMNS} /></section>
        </div>}
        {activeSection === "pericias" && <TableDisplaySettings key="pericias" storageKey="binotto-pericia-columns" labels={PERICIA_COLUMNS} />}
        {activeSection === "historico" && <AdminHistory />}
        {activeSection === "servico" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Visualização do veículo</h2>
            <div className="flex gap-2" role="group" aria-label="Visualização do veículo">
              {(["2d", "3d"] as const).map(view => (
                <Button key={view} type="button" aria-pressed={vehicleView === view}
                  variant={vehicleView === view ? "default" : "outline"}
                  onClick={() => { saveServiceVehicleView(view); setVehicleView(view); }}>
                  Veículo {view.toUpperCase()}
                </Button>
              ))}
            </div>
            <h2 className="pt-4 font-semibold">Referência do carro</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Referência do carro">
              {([["placa", "Placa"], ["chassi", "Chassi"]] as const).map(([key, label]) => {
                const selected = reference === key || reference === "ambos";
                return <Button key={key} type="button" aria-pressed={selected}
                  variant={selected ? "default" : "outline"}
                  disabled={!reference || savingReference || reference === key}
                  onClick={async () => {
                    const next = reference === "ambos" ? (key === "placa" ? "chassi" : "placa") : "ambos";
                    setSavingReference(true);
                    try {
                      await saveVehicleReference(next);
                      setReference(next);
                    } catch {
                      toast.error("Não foi possível salvar a referência do carro.");
                    } finally {
                      setSavingReference(false);
                    }
                  }}>{label}</Button>;
              })}
            </div>
            <h2 className="pt-4 font-semibold">Mostradores da tela principal</h2>
            <ul className="max-w-lg divide-y rounded-lg border">
              {columns.map(({ id, visible }, index) => <li key={id} className="flex items-center justify-between gap-2 px-3 py-1"
                onDragOver={event => event.preventDefault()}
                onDrop={event => { event.preventDefault(); if (dragged.current) moveColumn(dragged.current, index); dragged.current = null; }}>
                <label className="flex flex-1 items-center gap-2">
                  <input type="checkbox" checked={visible} onChange={event => updateColumns(columns.map(column =>
                    column.id === id ? { ...column, visible: event.target.checked } : column))} />
                  {SERVICE_COLUMNS[id]}
                </label>
                <Button variant="ghost" size="icon" draggable className="cursor-grab" aria-label={`Reordenar ${SERVICE_COLUMNS[id]}`}
                  onDragStart={event => { dragged.current = id; event.dataTransfer.setData("text/plain", id); }}
                  onDragEnd={() => { dragged.current = null; }}
                  onKeyDown={event => {
                    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                      event.preventDefault();
                      moveColumn(id, index + (event.key === "ArrowUp" ? -1 : 1));
                    }
                  }}><GripVertical className="size-4" /></Button>
              </li>)}
            </ul>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
