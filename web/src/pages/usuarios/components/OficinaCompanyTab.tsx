import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { AppUser } from "@/types/user";

type Props = { user: AppUser; onUserUpdated: (user: AppUser) => void };

/** Dados empresariais ficam separados do perfil de contato da oficina. */
export default function OficinaCompanyTab({ user, onUserUpdated }: Props) {
  const [tradeName, setTradeName] = useState(user.tradeName ?? user.name ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [documentValue, setDocumentValue] = useState(user.document ?? "");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await userService.update(user.id, {
        nome_fantasia: tradeName.trim(),
        nome_responsavel: user.responsible ?? "",
        razao_social: companyName.trim() || null,
        documento: documentValue.trim() || null,
        email: user.email,
        codigo_pais_telefone: user.phoneCountryCode ?? "+55",
        numero_telefone: user.phoneNumber ?? "",
        iso_pais_telefone: user.phoneCountryIso ?? "BR",
        cidade: user.city ?? "",
        pais: user.country ?? "BR",
        status: user.status === "ativo",
      });
      onUserUpdated(updated);
      toast.success("Dados da empresa salvos");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <div>
        <h3 className="font-semibold">Dados da empresa</h3>
        <p className="text-xs text-muted-foreground mt-1">Nome, razão social e CNPJ da oficina.</p>
      </div>
      <div className="grid gap-4">
        <div className="space-y-2"><Label>Nome da oficina</Label><Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Razão social</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
        <div className="space-y-2"><Label>CNPJ</Label><Input value={documentValue} onChange={(e) => setDocumentValue(e.target.value)} /></div>
      </div>
      <Button type="submit" disabled={saving} className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent-light))] text-black font-semibold">
        {saving ? "Salvando..." : "Salvar dados da empresa"}
      </Button>
    </form>
  );
}
