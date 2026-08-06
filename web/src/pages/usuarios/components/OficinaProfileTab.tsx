import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { AppUser, PaymentTerms } from "@/types/user";

const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "personalizado", label: "Personalizado" },
];

const KNOWN_PAYMENT_TERMS = new Set(
  PAYMENT_TERMS_OPTIONS.map((option) => option.value).filter((value) => value !== "personalizado"),
);

const FIELD_MAP: Record<string, string> = {
  nome_fantasia: "tradeName",
  nome_responsavel: "responsible",
  razao_social: "companyName",
  documento: "document",
  email: "email",
  codigo_pais_telefone: "phone",
  numero_telefone: "phone",
  iso_pais_telefone: "phone",
  telefone_secundario: "whatsapp",
  codigo_pais_telefone_secundario: "whatsapp",
  iso_pais_telefone_secundario: "whatsapp",
  rua: "street",
  numero: "number",
  complemento: "complement",
  cidade: "city",
  estado: "state",
  cep: "zip",
  pais: "country",
  status: "status",
  prazo_pagamento: "paymentTerm",
};

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
  onDeleted: () => void;
};

export default function OficinaProfileTab({ user, onUserUpdated, onDeleted }: Props) {
  const [tradeName, setTradeName] = useState(user.tradeName ?? user.name ?? "");
  const [responsible, setResponsible] = useState(user.responsible ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [documentValue, setDocumentValue] = useState(user.document ?? "");
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
  const [street, setStreet] = useState(user.street ?? "");
  const [number, setNumber] = useState(user.number ?? "");
  const [complement, setComplement] = useState(user.complement ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [zip, setZip] = useState(user.zip ?? "");
  const [countryIso, setCountryIso] = useState(user.country ?? "");

  const loadedPaymentTerm = user.paymentTerm ?? "mensal";
  const [paymentTerm, setPaymentTerm] = useState(
    KNOWN_PAYMENT_TERMS.has(loadedPaymentTerm as "semanal" | "quinzenal" | "mensal")
      ? loadedPaymentTerm
      : "personalizado",
  );
  const [customPaymentTerm, setCustomPaymentTerm] = useState(
    KNOWN_PAYMENT_TERMS.has(loadedPaymentTerm as "semanal" | "quinzenal" | "mensal")
      ? ""
      : loadedPaymentTerm,
  );

  const [active, setActive] = useState(user.status === "ativo");
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function applyStatusToggle() {
    setTogglingStatus(true);
    try {
      const { message, data } = await userService.toggleStatus(user.id);
      setActive(data.status === "ativo");
      onUserUpdated(data);
      toast.success(message);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setTogglingStatus(false);
      setConfirmToggleOpen(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const prazoPagamento = paymentTerm === "personalizado" ? customPaymentTerm.trim() : paymentTerm;

    try {
      const data = await userService.update(user.id, {
        nome_fantasia: tradeName.trim(),
        nome_responsavel: responsible.trim(),
        razao_social: companyName.trim() || null,
        documento: documentValue.trim() || null,
        email: email.trim().toLowerCase(),
        codigo_pais_telefone: phone.codigo_pais_telefone,
        numero_telefone: phone.numero_telefone,
        iso_pais_telefone: phone.iso_pais_telefone,
        telefone_secundario: whatsapp.numero_telefone || null,
        codigo_pais_telefone_secundario: whatsapp.codigo_pais_telefone || null,
        iso_pais_telefone_secundario: whatsapp.iso_pais_telefone || null,
        rua: street.trim() || null,
        numero: number.trim() || null,
        complemento: complement.trim() || null,
        cidade: city.trim(),
        estado: state.trim() || null,
        cep: zip.trim() || null,
        pais: countryIso,
        status: active,
        prazo_pagamento: prazoPagamento || null,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Perfil da oficina</h3>
            <p className="text-xs text-muted-foreground">
              Preenchimento: {user.profileCompletionPercent ?? 0}%
            </p>
          </div>
          <div className="flex items-center gap-3 bg-accent/40 rounded-xl px-4 py-3">
            <div>
              <Label className="text-sm">Usuário ativo</Label>
              <p className="text-xs text-muted-foreground">Controla acesso ao app</p>
            </div>
            <Switch
              checked={active}
              disabled={togglingStatus}
              onCheckedChange={() => setConfirmToggleOpen(true)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da oficina</Label>
            <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
            {errors.tradeName && <p className="text-xs text-destructive">{errors.tradeName}</p>}
          </div>
          <div className="space-y-2">
            <Label>Nome do responsável</Label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            {errors.responsible && <p className="text-xs text-destructive">{errors.responsible}</p>}
          </div>
          <PhoneInput label="Telefone" value={phone} onChange={setPhone} error={errors.phone} />
          <PhoneInput label="WhatsApp" value={whatsapp} onChange={setWhatsapp} error={errors.whatsapp} />
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Razão social</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>CNPJ</Label>
            <Input value={documentValue} onChange={(e) => setDocumentValue(e.target.value)} />
            {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Rua</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
            {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input value={complement} onChange={(e) => setComplement(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input value={zip} onChange={(e) => setZip(e.target.value)} />
            {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
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
          <div className="space-y-2 md:col-span-2">
            <Label>Prazo de pagamento</Label>
            <Select value={paymentTerm} onValueChange={setPaymentTerm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paymentTerm === "personalizado" && (
              <Input
                className="mt-2"
                placeholder="Descreva o prazo de pagamento"
                value={customPaymentTerm}
                onChange={(e) => setCustomPaymentTerm(e.target.value)}
              />
            )}
            {errors.paymentTerm && <p className="text-xs text-destructive">{errors.paymentTerm}</p>}
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
          Remove a oficina do sistema. Será solicitada a senha do administrador.
        </p>
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Excluir
        </Button>
      </div>

      <AlertDialog open={confirmToggleOpen} onOpenChange={setConfirmToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{active ? "Desativar usuário?" : "Reativar usuário?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {active
                ? "O usuário perderá acesso ao aplicativo até ser reativado."
                : "O usuário poderá acessar o aplicativo novamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                applyStatusToggle();
              }}
              disabled={togglingStatus}
            >
              {togglingStatus ? "Aguarde..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir oficina?</AlertDialogTitle>
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
