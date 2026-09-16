import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { AppUser } from "@/types/user";

type Props = { user: AppUser; onUserUpdated: (user: AppUser) => void };

export default function TecnicoBankingTab({ user, onUserUpdated }: Props) {
  const [name, setName] = useState(user.bankName ?? "");
  const [iban, setIban] = useState(user.bankIban ?? "");
  const [swift, setSwift] = useState(user.bankSwift ?? "");
  const [address, setAddress] = useState(user.bankAddress ?? "");
  const [saving, setSaving] = useState(false);
  const { markDirty, markSaved } = useUnsavedChanges();
  useEffect(() => { setName(user.bankName ?? ""); setIban(user.bankIban ?? ""); setSwift(user.bankSwift ?? ""); setAddress(user.bankAddress ?? ""); markSaved(); }, [user, markSaved]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const updated = await userService.update(user.id, { banco_nome: name.trim() || null, banco_iban: iban.trim().toUpperCase() || null, banco_swift: swift.trim().toUpperCase() || null, banco_endereco: address.trim() || null });
      onUserUpdated(updated); markSaved(); toast.success("Dados bancários atualizados.");
    } catch (error) { toast.error(getApiErrorMessage(error)); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} onChange={markDirty} className="space-y-6">
    <div className="pb-4 border-b border-border"><div className="flex items-center gap-2"><Landmark className="w-4 h-4"/><h3 className="font-semibold">Dados bancários</h3></div><p className="text-xs text-muted-foreground mt-1">Dados para pagamentos ao técnico.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2 md:col-span-2"><Label>Nome / titular da conta</Label><Input value={name} onChange={(e)=>setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>IBAN</Label><Input value={iban} onChange={(e)=>setIban(e.target.value)} placeholder="IT60X0542811101000000123456" /></div>
      <div className="space-y-2"><Label>SWIFT / BIC</Label><Input value={swift} onChange={(e)=>setSwift(e.target.value)} placeholder="BCITITMM" /></div>
      <div className="space-y-2 md:col-span-2"><Label>Endereço cadastrado no banco</Label><Input value={address} onChange={(e)=>setAddress(e.target.value)} /></div>
    </div>
    <div className="flex justify-end pt-4 border-t border-border"><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar dados bancários"}</Button></div>
  </form>;
}
