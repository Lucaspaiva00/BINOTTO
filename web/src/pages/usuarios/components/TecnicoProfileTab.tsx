import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import type { AppUser } from "@/types/user";
import UserSuspendAction from "./UserSuspendAction";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const FIELD_MAP: Record<string, string> = {
  nome_completo: "name",
  apelido: "nickname",
  documento: "document",
  email: "email",
  codigo_pais_telefone: "phone",
  numero_telefone: "phone",
  iso_pais_telefone: "phone",
  telefone_titular: "phoneOwner",
  telefone_secundario: "whatsapp",
  codigo_pais_telefone_secundario: "whatsapp",
  iso_pais_telefone_secundario: "whatsapp",
  telefone_secundario_titular: "whatsappOwner",
  rua: "street",
  numero: "number",
  complemento: "complement",
  cidade: "city",
  estado: "state",
  cep: "zip",
  pais: "country",
};

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
};

export default function TecnicoProfileTab({ user, onUserUpdated }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [documentValue, setDocumentValue] = useState(user.document ?? "");
  const [email, setEmail] = useState(user.email);
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
  const [languages, setLanguages] = useState(user.languages ?? []);
  const [street, setStreet] = useState(user.street ?? "");
  const [number, setNumber] = useState(user.number ?? "");
  const [complement, setComplement] = useState(user.complement ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [zip, setZip] = useState(user.zip ?? "");
  const [countryIso, setCountryIso] = useState(user.country ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const { markDirty, markSaved } = useUnsavedChanges();

  useEffect(() => {
    setName(user.name ?? "");
    setNickname(user.nickname ?? "");
    setDocumentValue(user.document ?? "");
    setEmail(user.email);
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
    setLanguages(user.languages ?? []);
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

    try {
      const data = await userService.update(user.id, {
        nome_completo: name.trim(),
        apelido: nickname.trim() || null,
        documento: documentValue.trim() || null,
        email: email.trim().toLowerCase(),
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
        idiomas: languages,
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
          <div className="space-y-2 md:col-span-2">
            <Label>CPF</Label>
            <Input value={documentValue} onChange={(e) => setDocumentValue(e.target.value)} />
            {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
          </div>
          <div className="space-y-2"><PhoneInput label="Telefone" value={phone} onChange={setPhone} error={errors.phone} /><Label>De quem é este telefone?</Label><Input value={phoneOwner} onChange={(e) => setPhoneOwner(e.target.value)} placeholder="Ex.: Próprio" />{errors.phoneOwner && <p className="text-xs text-destructive">{errors.phoneOwner}</p>}</div>
          <div className="space-y-2"><PhoneInput label="WhatsApp / telefone secundário" value={whatsapp} onChange={setWhatsapp} error={errors.whatsapp} /><Label>De quem é este telefone?</Label><Input value={whatsappOwner} onChange={(e) => setWhatsappOwner(e.target.value)} placeholder="Ex.: Comercial / Familiar" />{errors.whatsappOwner && <p className="text-xs text-destructive">{errors.whatsappOwner}</p>}</div>
          <div className="space-y-2 md:col-span-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
            <CityInput listId={`tecnico-city-${user.id}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Digite para localizar a cidade" />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
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
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between"><div><h4 className="font-medium">Idiomas do técnico</h4><p className="text-xs text-muted-foreground">Adicione o idioma e o nível de conhecimento.</p></div><Button type="button" variant="outline" size="sm" onClick={() => { setLanguages((prev) => [...prev, { idioma: "", nivel: "basico" }]); markDirty(); }}><Plus className="w-4 h-4 mr-1" />Idioma</Button></div>
          {languages.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum idioma informado.</p> : languages.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_180px_40px] gap-2 items-center">
              <Input value={item.idioma} onChange={(e) => setLanguages((prev) => prev.map((lang, i) => i === index ? { ...lang, idioma: e.target.value } : lang))} placeholder="Ex.: Italiano" />
              <Select value={item.nivel} onValueChange={(nivel) => { setLanguages((prev) => prev.map((lang, i) => i === index ? { ...lang, nivel: nivel as typeof item.nivel } : lang)); markDirty(); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="basico">Básico</SelectItem><SelectItem value="intermediario">Intermediário</SelectItem><SelectItem value="avancado">Avançado</SelectItem><SelectItem value="fluente">Fluente</SelectItem><SelectItem value="nativo">Nativo</SelectItem></SelectContent></Select>
              <Button type="button" size="icon" variant="ghost" onClick={() => { setLanguages((prev) => prev.filter((_, i) => i !== index)); markDirty(); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
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
