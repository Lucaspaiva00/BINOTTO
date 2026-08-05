import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { adminService } from "@/services/adminService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { Administrator } from "@/types/admin";

const FIELD_MAP: Record<string, string> = {
  nome: "name",
  email: "email",
  senha: "password",
  confirmar_senha: "confirm",
  status: "status",
};

export default function AdministratorEdit() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const { user, updateUser } = useAuth();

  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAdministrator() {
      setLoading(true);

      try {
        const data = await adminService.show(id);
        if (cancelled) return;

        setAdministrator(data);
        setName(data.name);
        setEmail(data.email);
        setActive(data.status === "ativo");
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAdministrator();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Editar administrador">
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !administrator) {
    return (
      <AppLayout title="Administrador não encontrado">
        <Button variant="outline" onClick={() => navigate("/administradores")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </AppLayout>
    );
  }

  const isSelf = user?.id === administrator.id;

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Informe o nome.";
    if (!email.trim()) e.email = "Informe o e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido.";
    if (password) {
      if (password.length < 6) e.password = "Senha deve ter ao menos 6 caracteres.";
      if (confirm !== password) e.confirm = "As senhas não conferem.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate() || !administrator) return;

    setSubmitting(true);

    try {
      const updated = await adminService.update(administrator.id, {
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        senha: password || null,
        confirmar_senha: password ? confirm : null,
        status: active,
      });

      if (user && user.id === updated.id) {
        updateUser({
          ...user,
          name: updated.name,
          email: updated.email,
          active: updated.status === "ativo",
        });
      }

      toast.success("Administrador atualizado", { description: `As alterações de ${name} foram salvas.` });
      navigate("/administradores");
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);

      if (validationErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validationErrors)) {
          mapped[FIELD_MAP[field] ?? field] = message;
        }
        setErrors(mapped);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Editar administrador" subtitle={administrator.email}>
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-xl mx-auto space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome {isSelf && <span className="text-muted-foreground font-normal">(você)</span>}
          </Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Deixe em branco para manter a atual"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>

        <div className="border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">Status da conta</p>
            <p className="text-xs text-muted-foreground">
              {active ? "O administrador pode acessar o painel." : "O acesso ao painel está bloqueado."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Desativado"}</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/administradores")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
