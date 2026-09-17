import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Spinner } from "@/components/ui/spinner";
import { userService } from "@/services/userService";
import { periciaService } from "@/services/periciaService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { UserSelectionItem } from "@/types/user";

export default function PericiaEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [workshopId, setWorkshopId] = useState("");
  const [technicianId, setTechnicianId] = useState("none");
  const [plate, setPlate] = useState("");
  const [chassis, setChassis] = useState("");
  const [model, setModel] = useState("");
  const [value, setValue] = useState(0);
  const [password, setPassword] = useState("");
  const [publicNumber, setPublicNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { markDirty, markSaved, confirmDiscard } = useUnsavedChanges();

  useEffect(() => {
    let cancelled = false;
    Promise.all([periciaService.show(id), userService.listForSelection("OFICINA"), userService.listForSelection("TECNICO")])
      .then(([p, shops, techs]) => {
        if (cancelled) return;
        setWorkshops(shops); setTechnicians(techs); setPublicNumber(p.publicNumber || `#${p.id}`);
        const shop = p.workshopId ? shops.find((item) => item.id === p.workshopId) : shops.find((item) => item.name === p.workshop);
        const tech = p.technicianId ? techs.find((item) => item.id === p.technicianId) : techs.find((item) => item.name === p.technician);
        setWorkshopId(shop ? String(shop.id) : "");
        setTechnicianId(tech ? String(tech.id) : "none");
        setPlate(p.licensePlate ?? ""); setChassis(p.chassis ?? ""); setModel(p.model ?? ""); setValue(p.inspectionValue ?? p.suggestedPrice ?? 0);
        markSaved();
      })
      .catch((error) => toast.error(getApiErrorMessage(error)))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, markSaved]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) { toast.error("Informe a senha do administrador para editar a perícia."); return; }
    if (!workshopId || !plate.trim() || !chassis.trim() || !model.trim()) { toast.error("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    try {
      const updated = await periciaService.update(id, { senha: password, oficina_id: Number(workshopId), tecnico_id: technicianId === "none" ? null : Number(technicianId), placa: plate, chassi: chassis, marca_modelo: model, valor_pericia: value });
      markSaved(); toast.success(`Perícia ${updated.publicNumber || `#${updated.id}`} atualizada.`); navigate(`/pericias/${id}`);
    } catch (error) { toast.error(getApiErrorMessage(error)); } finally { setSaving(false); }
  }

  if (loading) return <AppLayout title="Editar perícia"><div className="py-20"><Spinner className="mx-auto h-8 w-8" /></div></AppLayout>;

  return <AppLayout title={`Editar perícia ${publicNumber || `#${id}`}`} subtitle="A edição exige a senha do administrador">
    <form onSubmit={submit} onChange={markDirty} className="space-y-4 max-w-4xl">
      <Button type="button" variant="outline" size="sm" onClick={() => { if (confirmDiscard()) navigate(`/pericias/${id}`); }}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
      <section className="rounded-2xl border border-border bg-card p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Oficina</Label><SearchableSelect value={workshopId} onChange={(v) => { setWorkshopId(v); markDirty(); }} placeholder="Digite ou selecione a oficina" options={workshops.map((w) => ({ value: String(w.id), label: w.name }))} /></div>
        <div className="space-y-2"><Label>Técnico</Label><Select value={technicianId} onValueChange={(v) => { setTechnicianId(v); markDirty(); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem técnico</SelectItem>{technicians.map((t)=><SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Placa</Label><Input value={plate} onChange={(e)=>setPlate(e.target.value.toUpperCase())}/></div>
        <div className="space-y-2"><Label>Chassi</Label><Input value={chassis} onChange={(e)=>setChassis(e.target.value.toUpperCase())}/></div>
        <div className="space-y-2 md:col-span-2"><Label>Marca / modelo</Label><Input value={model} onChange={(e)=>setModel(e.target.value)}/></div>
        <div className="space-y-2"><Label>Valor da perícia</Label><CurrencyInput value={value} onChange={(v) => { setValue(v); markDirty(); }} /></div>
      </section>
      <section className="rounded-2xl border border-amber-500/30 bg-card p-5"><div className="flex items-center gap-2 mb-3"><LockKeyhole className="h-4 w-4"/><h3 className="font-semibold">Confirmação de segurança</h3></div><div className="space-y-2 max-w-md"><Label>Senha do administrador</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" /></div></section>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar edição"}</Button></div>
    </form>
  </AppLayout>;
}
