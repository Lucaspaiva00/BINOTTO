import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

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
        className="mt-5 min-h-[380px] rounded-xl border border-border bg-card"
      />
    </AppLayout>
  );
}
