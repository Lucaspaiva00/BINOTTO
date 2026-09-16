import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CityInput } from "@/components/ui/city-input";
import { Label } from "@/components/ui/label";
import { PhoneInput, type PhoneValue } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import { COUNTRIES } from "@/utils/countries";
import type { AppUser, PaymentTerms } from "@/types/user";
import UserSuspendAction from "./UserSuspendAction";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "personalizado", label: "Personalizado" },
];

const KNOWN_PAYMENT_TERMS = new Set(["semanal", "quinzenal", "mensal"]);

const FIELD_MAP: Record<string, string> = {
  nome_responsavel: "responsible",
  email: "email",
  email_secundario: "secondaryEmail",
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
  prazo_pagamento: "paymentTerm",
  telefone_titular: "phoneOwner",
  telefone_secundario_titular: "whatsappOwner",
  nome_fantasia: "tradeName",
  razao_social: "companyName",
  documento: "companyDocument",
};

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
};

export default function OficinaProfileTab({ user, onUserUpdated }: Props) {
  const [tradeName, setTradeName] = useState(user.tradeName ?? user.name ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [companyDocument, setCompanyDocument] = useState(user.companyDocument ?? user.document ?? "");
  const [responsible, setResponsible] = useState(user.responsible ?? "");
  const [email, setEmail] = useState(user.email);
  const [secondaryEmail, setSecondaryEmail] = useState(user.secondaryEmail ?? "");
  const [phone, setPhone] = useState<PhoneValue>({
    codigo_pais_telefone: user.phoneCountryCode ?? "+39",
    numero_telefone: user.phoneNumber ?? "",
    iso_pais_telefone: user.phoneCountryIso ?? "IT",
  });
  const [phoneOwner, setPhoneOwner] = useState(user.phoneOwner ?? "");
  const [whatsapp, setWhatsapp] = useState<PhoneValue>({
    codigo_pais_telefone: user.secondaryPhoneCountryCode ?? "+39",
    numero_telefone: user.secondaryPhoneNumber ?? "",
    iso_pais_telefone: user.secondaryPhoneCountryIso ?? "IT",
  });
  const [whatsappOwner, setWhatsappOwner] = useState(user.secondaryPhoneOwner ?? "");
  const [street, setStreet] = useState(user.street ?? "");
  const [number, setNumber] = useState(user.number ?? "");
  const [complement, setComplement] = useState(user.complement ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [zip, setZip] = useState(user.zip ?? "");
  const [countryIso, setCountryIso] = useState(user.country ?? "");

  const loadedPaymentTerm = user.paymentTerm ?? "mensal";
  const [paymentTerm, setPaymentTerm] = useState(
    KNOWN_PAYMENT_TERMS.has(loadedPaymentTerm) ? loadedPaymentTerm : "personalizado",
  );
  const [customPaymentTerm, setCustomPaymentTerm] = useState(
    KNOWN_PAYMENT_TERMS.has(loadedPaymentTerm) ? "" : loadedPaymentTerm,
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const { markDirty, markSaved } = useUnsavedChanges();

  useEffect(() => {
    setTradeName(user.tradeName ?? user.name ?? "");
    setCompanyName(user.companyName ?? "");
    setCompanyDocument(user.companyDocument ?? user.document ?? "");
    setResponsible(user.responsible ?? "");
    setEmail(user.email);
    setSecondaryEmail(user.secondaryEmail ?? "");
    setPhone({
      codigo_pais_telefone: user.phoneCountryCode ?? "+39",
      numero_telefone: user.phoneNumber ?? "",
      iso_pais_telefone: user.phoneCountryIso ?? "IT",
    });
    setPhoneOwner(user.phoneOwner ?? "");
    setWhatsapp({
      codigo_pais_telefone: user.secondaryPhoneCountryCode ?? "+39",
      numero_telefone: user.secondaryPhoneNumber ?? "",
      iso_pais_telefone: user.secondaryPhoneCountryIso ?? "IT",
    });
    setWhatsappOwner(user.secondaryPhoneOwner ?? "");
    markSaved();
    setStreet(user.street ?? "");
    setNumber(user.number ?? "");
    setComplement(user.complement ?? "");
    setCity(user.city ?? "");
    setState(user.state ?? "");
    setZip(user.zip ?? "");
    setCountryIso(user.country ?? "");
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const prazoPagamento = paymentTerm === "personalizado" ? customPaymentTerm.trim() : paymentTerm;

    try {
      const data = await userService.update(user.id, {
        nome_fantasia: tradeName.trim() || null,
        razao_social: companyName.trim() || null,
        documento: companyDocument.trim() || null,
        nome_responsavel: responsible.trim() || null,
        email: email.trim().toLowerCase(),
        email_secundario: secondaryEmail.trim().toLowerCase() || null,
        codigo_pais_telefone: phone.codigo_pais_telefone,
        numero_telefone: phone.numero_telefone,
        telefone_titular: phoneOwner.trim() || null,
        iso_pais_telefone: phone.iso_pais_telefone,
        telefone_secundario: whatsapp.numero_telefone || null,
        telefone_secundario_titular: whatsapp.numero_telefone ? (whatsappOwner.trim() || null) : null,
        codigo_pais_telefone_secundario: whatsapp.numero_telefone ? whatsapp.codigo_pais_telefone : null,
        iso_pais_telefone_secundario: whatsapp.numero_telefone ? whatsapp.iso_pais_telefone : null,
        rua: street.trim() || null,
        numero: number.trim() || null,
        complemento: complement.trim() || null,
        cidade: city.trim() || null,
        estado: state.trim() || null,
        cep: zip.trim() || null,
        pais: countryIso || null,
        prazo_pagamento: prazoPagamento || null,
      });

      onUserUpdated(data);
      markSaved();
      toast.success("Alterações salvas.");
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
      toast.error("Confirme a nova senha corretamente.");
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

  return (
    <>
      <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6">
        <div className="pb-4 border-b border-border">
          <h3 className="font-semibold">Perfil da oficina</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Preenchimento: {user.profileCompletionPercent ?? 0}%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome da oficina</Label><Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Razão social</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>CNPJ</Label><Input value={companyDocument} onChange={(e) => setCompanyDocument(e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>Nome do responsável</Label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            {errors.responsible && <p className="text-xs text-destructive">{errors.responsible}</p>}
          </div>
          <div className="space-y-2"><PhoneInput label="Telefone" value={phone} onChange={setPhone} error={errors.phone} /><Label>De quem é este telefone?</Label><Input value={phoneOwner} onChange={(e) => setPhoneOwner(e.target.value)} placeholder="Ex.: Responsável" />{errors.phoneOwner && <p className="text-xs text-destructive">{errors.phoneOwner}</p>}</div>
          <div className="space-y-2"><PhoneInput label="WhatsApp" value={whatsapp} onChange={setWhatsapp} error={errors.whatsapp} /><Label>De quem é este telefone?</Label><Input value={whatsappOwner} onChange={(e) => setWhatsappOwner(e.target.value)} placeholder="Ex.: Recepção" />{errors.whatsappOwner && <p className="text-xs text-destructive">{errors.whatsappOwner}</p>}</div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>E-mail secundário</Label>
            <Input type="email" value={secondaryEmail} onChange={(e) => setSecondaryEmail(e.target.value)} />
            {errors.secondaryEmail && <p className="text-xs text-destructive">{errors.secondaryEmail}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Rua</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input value={complement} onChange={(e) => setComplement(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <CityInput listId={`oficina-city-${user.id}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Digite para localizar a cidade" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <Select value={countryIso} onValueChange={(value) => { setCountryIso(value); markDirty(); }}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Prazo de pagamento</Label>
            <Select value={paymentTerm} onValueChange={(value) => { setPaymentTerm(value as PaymentTerms); markDirty(); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-border space-y-4">
        <h3 className="font-semibold">Alterar senha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label>Confirmar senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <Button type="button" variant="outline" disabled={passwordSaving} onClick={handlePasswordChange}>
          {passwordSaving ? "Salvando..." : "Atualizar senha"}
        </Button>
      </div>

      <UserSuspendAction user={user} onUserUpdated={onUserUpdated} />
    </>
  );
}
