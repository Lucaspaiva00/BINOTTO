import { useState } from "react";
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
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

  const [vehicleView, setVehicleView] = useState(getServiceVehicleView);

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
          </div>
        )}
      </section>
    </AppLayout>
  );
}
