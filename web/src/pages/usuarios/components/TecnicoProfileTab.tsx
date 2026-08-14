import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, type PhoneValue } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import { COUNTRIES } from "@/utils/countries";
import type { AppUser } from "@/types/user";

const FIELD_MAP: Record<string, string> = {
  nome_completo: "name",
  apelido: "nickname",
  email: "email",
  codigo_pais_telefone: "phone",
  numero_telefone: "phone",
  iso_pais_telefone: "phone",
  telefone_secundario: "whatsapp",
  codigo_pais_telefone_secundario: "whatsapp",
  iso_pais_telefone_secundario: "whatsapp",
  cidade: "city",
  pais: "country",
  status: "status",
};

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
  onDeleted: () => void;
};

export default function TecnicoProfileTab({ user, onUserUpdated, onDeleted }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState<PhoneValue>({
    codigo_pais_telefone: user.phoneCountryCode ?? "+55",
    numero_telefone: user.phoneNumber ?? "",
    iso_pais_telefone: user.phoneCountryIso ?? "BR",
  });
  const [whatsapp, setWhatsapp] = useState<PhoneValue>({
    codigo_pais_telefone: user.secondaryPhoneCountryCode ?? "+55",
    numero_telefone: user.secondaryPhoneNumber ?? "",
    iso_pais_telefone: user.secondaryPhoneCountryIso ?? "BR",
  });
  const [city, setCity] = useState(user.city ?? "");
  const [countryIso, setCountryIso] = useState(user.country ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const data = await userService.update(user.id, {
        nome_completo: name.trim(),
        apelido: nickname.trim() || null,
        email: email.trim().toLowerCase(),
        codigo_pais_telefone: phone.codigo_pais_telefone,
        numero_telefone: phone.numero_telefone,
        iso_pais_telefone: phone.iso_pais_telefone,
        telefone_secundario: whatsapp.numero_telefone || null,
        codigo_pais_telefone_secundario: whatsapp.codigo_pais_telefone || null,
        iso_pais_telefone_secundario: whatsapp.iso_pais_telefone || null,
        cidade: city.trim(),
        pais: countryIso,
        status: user.status === "ativo",
      });

      onUserUpdated(data);
      toast.success("Alterações salvas");
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

  async function handlePasswordChange() {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Confirme a nova senha corretamente");
      return;
    }

    setPasswordSaving(true);
    try {
      const { message } = await userService.updatePassword(user.id, {
        senha: newPassword,
        confirmar_senha: confirmPassword,
      });
      toast.success(message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletePassword.trim()) {
      toast.error("Informe a senha do administrador");
      return;
    }

    setDeleting(true);
    try {
      const { message } = await userService.delete(user.id, deletePassword);
      toast.success(message);
      onDeleted();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h3 className="font-semibold">Perfil do técnico</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Preenchimento: {user.profileCompletionPercent ?? 0}%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Apelido</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
            {errors.nickname && <p className="text-xs text-destructive">{errors.nickname}</p>}
          </div>
          <PhoneInput label="Telefone" value={phone} onChange={setPhone} error={errors.phone} />
          <PhoneInput label="WhatsApp" value={whatsapp} onChange={setWhatsapp} error={errors.whatsapp} />
          <div className="space-y-2 md:col-span-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <Select value={countryIso} onValueChange={setCountryIso}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent-light))] text-black font-semibold"
          >
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-border space-y-4">
        <h3 className="font-semibold">Alterar senha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <Button type="button" variant="outline" disabled={passwordSaving} onClick={handlePasswordChange}>
          {passwordSaving ? "Salvando..." : "Atualizar senha"}
        </Button>
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="font-semibold text-destructive">Excluir</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Remove o técnico do sistema. Será solicitada a senha do administrador.
        </p>
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Excluir
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir técnico?</AlertDialogTitle>
            <AlertDialogDescription>
              Digite a senha do administrador para confirmar a exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Senha do administrador</Label>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
