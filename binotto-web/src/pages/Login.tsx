import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import logoFull from "@/assets/logos/binotto-logo-2.png";

export default function Login() {
  const { theme, toggle } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  usePageTitle("Login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground relative">
      <button
        onClick={toggle}
        aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full border border-border bg-card hover:bg-accent transition-colors flex items-center justify-center text-foreground cursor-pointer"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div
        className="lg:w-1/2 p-10 lg:p-16 flex flex-col min-h-65"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--app-accent)) 0%, hsl(var(--app-accent-light)) 100%)",
        }}
      >
        <div className="flex flex-1 items-center justify-center">
          <img src={logoFull} alt="Binotto PDR" className="max-w-md w-full object-contain" />
        </div>
        <p className="hidden lg:block text-xs text-black/60">
          © {new Date().getFullYear()} Binotto PDR · Acesso restrito
        </p>
      </div>

      {/* Right: form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Lock className="w-4 h-4" />
            Acesso restrito
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Entrar no painel</h1>
          <p className="text-muted-foreground mt-1">
            Use suas credenciais de administrador para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <div className="space-y-3">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent-light))] text-black font-semibold"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            Problemas de acesso? Fale com o suporte interno.
          </p>
        </div>
      </div>
    </div>
  );
}