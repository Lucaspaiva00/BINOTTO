import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput, type PhoneValue } from "@/components/ui/phone-input";
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
import OficinaProfileTab from "./components/OficinaProfileTab";
import OficinaDocumentsTab from "./components/OficinaDocumentsTab";
import OficinaSupportTab from "./components/OficinaSupportTab";

const FIELD_MAP: Record<string, string> = {
  nome_completo: "name",
  documento: "document",
  email: "email",
  codigo_pais_telefone: "phone",
  numero_telefone: "phone",
  iso_pais_telefone: "phone",
  telefone_secundario: "secondaryPhone",
  codigo_pais_telefone_secundario: "secondaryPhone",
  iso_pais_telefone_secundario: "secondaryPhone",
  cidade: "city",
  pais: "country",
  status: "status",
};

export default function UserEdit() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("perfil");

  const [name, setName] = useState("");
  const [documentValue, setDocumentValue] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue>({
    codigo_pais_telefone: "",
    numero_telefone: "",
    iso_pais_telefone: "",
  });
  const [secondaryPhone, setSecondaryPhone] = useState<PhoneValue>({
    codigo_pais_telefone: "",
    numero_telefone: "",
    iso_pais_telefone: "",
  });
  const [city, setCity] = useState("");
  const [countryIso, setCountryIso] = useState("");
  const [active, setActive] = useState(true);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setLoading(true);

      try {
        const data = await userService.show(id);
        if (cancelled) return;

        setUser(data);
        setName(data.name ?? "");
        setDocumentValue(data.document ?? "");
        setEmail(data.email);
        setPhone({
          codigo_pais_telefone: data.phoneCountryCode ?? "+55",
          numero_telefone: data.phoneNumber ?? "",
          iso_pais_telefone: data.phoneCountryIso ?? "BR",
        });
        setSecondaryPhone({
          codigo_pais_telefone: data.secondaryPhoneCountryCode ?? "+55",
          numero_telefone: data.secondaryPhoneNumber ?? "",
          iso_pais_telefone: data.secondaryPhoneCountryIso ?? "BR",
        });
        setCity(data.city ?? "");
        setCountryIso(data.country ?? "");
        setActive(data.status === "ativo");
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Editar usuário">
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !user) {
    return (
      <AppLayout title="Usuário não encontrado">
        <Button variant="outline" onClick={() => navigate("/usuarios")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </AppLayout>
    );
  }

  const isTech = user.profile === "TECNICO";
  const displayName = user.name || user.email;

  async function applyStatusToggle() {
    if (!user) return;

    setTogglingStatus(true);

    try {
      const { message, data } = await userService.toggleStatus(user.id);
      setActive(data.status === "ativo");
      setUser(data);
      toast.success(message);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setTogglingStatus(false);
      setConfirmToggleOpen(false);
    }
  }

  async function handleTechSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      await userService.update(user.id, {
        nome_completo: name.trim(),
        documento: documentValue.trim() || null,
        email: email.trim().toLowerCase(),
        codigo_pais_telefone: phone.codigo_pais_telefone,
        numero_telefone: phone.numero_telefone,
        iso_pais_telefone: phone.iso_pais_telefone,
        telefone_secundario: secondaryPhone.numero_telefone || null,
        codigo_pais_telefone_secundario: secondaryPhone.codigo_pais_telefone || null,
        iso_pais_telefone_secundario: secondaryPhone.iso_pais_telefone || null,
        cidade: city.trim(),
        pais: countryIso,
        status: active,
      });

      toast.success("Alterações salvas");
      navigate("/usuarios");
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
    <AppLayout title="Editar usuário" subtitle={displayName}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/usuarios")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para usuários
      </Button>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--app-accent))] text-black flex items-center justify-center font-bold text-lg shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
              <div className="flex gap-2 mt-1">
                <Badge variant={isTech ? "secondary" : "outline"}>
                  {isTech ? "Técnico" : "Oficina"}
                </Badge>
                {active ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-transparent">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Desativado</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isTech ? (
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="suporte">Suporte</TabsTrigger>
            </TabsList>
            <TabsContent value="perfil" className="mt-6">
              <OficinaProfileTab
                user={user}
                onUserUpdated={(updated) => {
                  setUser(updated);
                  setActive(updated.status === "ativo");
                }}
                onDeleted={() => navigate("/usuarios")}
              />
            </TabsContent>
            <TabsContent value="documentos" className="mt-6">
              <OficinaDocumentsTab userId={user.id} />
            </TabsContent>
            <TabsContent value="suporte" className="mt-6">
              <OficinaSupportTab userId={user.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleTechSubmit}>
            <div className="flex items-center justify-end mt-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>CPF / Documento</Label>
                <Input value={documentValue} onChange={(e) => setDocumentValue(e.target.value)} />
                {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <PhoneInput label="Telefone" value={phone} onChange={setPhone} error={errors.phone} disabled />
              <PhoneInput
                label="Telefone secundário"
                value={secondaryPhone}
                onChange={setSecondaryPhone}
                error={errors.secondaryPhone}
                disabled={submitting}
                className="md:col-span-2"
              />
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
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-8 pt-6 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate("/usuarios")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent-light))] text-black font-semibold"
              >
                {submitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        )}
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
    </AppLayout>
  );
}
