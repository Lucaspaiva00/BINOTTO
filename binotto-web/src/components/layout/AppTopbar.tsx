import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/utils/getInitials";

interface AppTopbarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function AppTopbar({ title, subtitle, onMenuClick }: AppTopbarProps) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  const initials = user?.name ? getInitials(user.name) : "US";

  return (
    <header className="h-[72px] border-b border-border bg-card/40 backdrop-blur flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="lg:hidden w-10 h-10 rounded-full border border-border bg-card hover:bg-accent transition-colors flex items-center justify-center text-foreground shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          className="w-10 h-10 rounded-full border border-border bg-card hover:bg-accent transition-colors flex items-center justify-center text-foreground cursor-pointer"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--app-accent))] text-black flex items-center justify-center font-semibold shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}
