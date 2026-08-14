import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, type PhoneValue } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { UserType } from "@/types/user";

const FIELD_MAP: Record<string, string> = {
  perfil: "profile",
  nome_completo: "name",
  apelido: "nickname",
  nome_fantasia: "tradeName",
  nome_responsavel: "responsible",
  email: "email",
  codigo_pais_telefone: "phone",
  numero_telefone: "phone",
  iso_pais_telefone: "phone",
  senha: "password",
  confirmar_senha: "confirm",
};

export default function UserNew() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserType>("TECNICO");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [responsible, setResponsible] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue>({
    codigo_pais_telefone: "+55",
    numero_telefone: "",
    iso_pais_telefone: "BR",
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isTech = profile === "TECNICO";

  function validate() {
    const e: Record<string, string> = {};
    if (isTech) {
      if (!name.trim()) e.name = "Informe o nome.";
    } else {
      if (!tradeName.trim()) e.tradeName = "Informe o nome da oficina.";
      if (!responsible.trim()) e.responsible = "Informe o responsável.";
    }
    if (!email.trim()) e.email = "Informe o e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido.";
    if (!phone.numero_telefone.trim()) e.phone = "Informe o telefone.";
    if (!password) e.password = "Informe a senha.";
    else if (password.length < 6) e.password = "Senha deve ter ao menos 6 caracteres.";
    if (confirm !== password) e.confirm = "As senhas não conferem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const user = await userService.create({
        perfil: profile,
        email: email.trim().toLowerCase(),
        codigo_pais_telefone: phone.codigo_pais_telefone,
        numero_telefone: phone.numero_telefone,
        iso_pais_telefone: phone.iso_pais_telefone,
        senha: password,
        confirmar_senha: confirm,
        ...(isTech
          ? {
              nome_completo: name.trim(),
              apelido: nickname.trim() || null,
            }
          : {
              nome_fantasia: tradeName.trim(),
              nome_responsavel: responsible.trim(),
            }),
      });

      toast.success(isTech ? "Técnico criado" : "Oficina criada");
      navigate(`/usuarios/${user.id}`);
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
    <AppLayout
      title="Novo usuário"
      subtitle={isTech ? "Cadastro de técnico" : "Cadastro de oficina"}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-xl mx-auto space-y-5"
      >
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={profile} onValueChange={(v) => setProfile(v as UserType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TECNICO">Técnico</SelectItem>
              <SelectItem value="OFICINA">Oficina</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isTech ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              {errors.nickname && <p className="text-xs text-destructive">{errors.nickname}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome da oficina</Label>
              <Input id="tradeName" value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
              {errors.tradeName && <p className="text-xs text-destructive">{errors.tradeName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible">Nome do responsável</Label>
              <Input id="responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
              {errors.responsible && <p className="text-xs text-destructive">{errors.responsible}</p>}
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <PhoneInput label="Telefone" value={phone} onChange={setPhone} error={errors.phone} />

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a senha"
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/usuarios")}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent-light))] text-black font-semibold"
          >
            {submitting ? "Criando..." : isTech ? "Criar técnico" : "Criar oficina"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
