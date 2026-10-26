import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  usePageTitle(title);

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <AppTopbar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <nav aria-label="Navegação dos módulos" className="border-b border-border bg-card/60 px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1 py-2 text-sm">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/usuarios", label: "Usuários" },
              { to: "/servicos", label: "Serviços" },
              { to: "/pericias", label: "Perícias" },
              { to: "/financeiro", label: "Financeiro" },
              { to: "/administradores", label: "Administradores" },
              { to: "/configuracoes", label: "Coeficientes e configurações" },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 whitespace-nowrap transition-colors ${isActive ? "bg-accent font-semibold text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
