import { NavLink, useNavigate } from "react-router-dom";
// import { LayoutDashboard } from "lucide-react"; // usado pelo item Dashboard, comentado abaixo
import { Users, Wallet, ClipboardList, ShieldCheck, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logos/binotto-logo-black.png";

const items = [
  // { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/servicos", label: "Serviços", icon: ClipboardList },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/administradores", label: "Administradores", icon: ShieldCheck },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 shrink-0 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className="h-[72px] flex items-center justify-between px-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(var(--app-accent)) 0%, hsl(var(--app-accent-light)) 100%)",
          }}
        >
          <img src={logo} alt="Binotto" className="h-20 object-contain" />
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-black hover:bg-black/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--app-accent))] text-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
