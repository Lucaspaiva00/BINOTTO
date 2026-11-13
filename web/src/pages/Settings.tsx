import { GripVertical } from "lucide-react";
import { getServiceColumns, getVehicleReference, saveServiceColumns, saveVehicleReference, SERVICE_COLUMNS, type ServiceColumn, type ColumnPreference } from "@/constants/servicePreferences";
import { AdminHistory } from "./AdminHistory";
import { useRef, useState } from "react";
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

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

  const [vehicleView, setVehicleView] = useState(getServiceVehicleView);

  const [reference, setReference] = useState(getVehicleReference);
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
                  disabled={reference === key}
                  onClick={() => {
                    const next = reference === "ambos" ? (key === "placa" ? "chassi" : "placa") : "ambos";
                    setReference(next);
                    saveVehicleReference(next);
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
