import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { userService } from "@/services/userService";
import { serviceService } from "@/services/serviceService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { UserSelectionItem } from "@/types/user";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const FIELD_MAP: Record<string, string> = {
  oficina_id: "workshopId",
  data_inicio: "startDate",
  data_fim: "endDate",
  quantidade_tipo: "quantityType",
  quantidade: "quantity",
  observacoes: "notes",
};

export default function ServicoNew() {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [workshopId, setWorkshopId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantityType, setQuantityType] = useState<"carros" | "dias">("carros");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { markDirty, markSaved } = useUnsavedChanges();

  const selectedWorkshop = workshops.find((w) => String(w.id) === workshopId);
  const workshopMissingAddress = selectedWorkshop?.canRequestTechnician === false;

  useEffect(() => {
    let cancelled = false;
    userService.listForSelection("OFICINA")
      .then((shops) => { if (!cancelled) setWorkshops(shops); })
      .catch((error) => { if (!cancelled) toast.error(getApiErrorMessage(error)); })
      .finally(() => { if (!cancelled) setLoadingOptions(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (quantityType === "carros") setQuantity("1");
  }, [quantityType]);

  function validate() {
    const next: Record<string, string> = {};
    if (!workshopId) next.workshopId = "Selecione a oficina.";
    if (workshopMissingAddress) next.workshopId = "A oficina precisa ter endereço completo.";
    if (!startDate) next.startDate = "Informe a data inicial.";
    if (startDate && endDate && endDate < startDate) next.endDate = "Data final deve ser igual ou posterior à inicial.";
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1) next.quantity = "Informe uma quantidade válida.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
      const created = await serviceService.createRequest({
        oficina_id: Number(workshopId),
        data_inicio: startDate,
        data_fim: endDate || startDate,
        quantidade_tipo: quantityType,
        quantidade: Number(quantity),
        observacoes: notes.trim() || undefined,
      });
      toast.success("Solicitação criada.");
      markSaved();
      navigate(`/servicos/${created.id}`);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      if (validationErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validationErrors)) mapped[FIELD_MAP[field] ?? field] = message;
        setErrors(mapped);
      } else toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Criar solicitação" subtitle="Fluxo equivalente à solicitação do aplicativo">
      <form onSubmit={handleSubmit} onChange={markDirty} className="flex flex-col gap-4 max-w-4xl">
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/servicos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
        </div>

        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <div className="rounded-xl bg-[hsl(var(--app-accent))]/15 p-2"><ClipboardList className="h-5 w-5" /></div>
            <div><h2 className="font-semibold">Solicitar serviço para uma oficina</h2><p className="text-sm text-muted-foreground">Selecione a oficina e informe o período e a quantidade, como no fluxo do app.</p></div>
          </div>

          <div className="space-y-2">
            <Label>Oficina</Label>
            <SearchableSelect
              value={workshopId}
              onChange={(value) => { setWorkshopId(value); markDirty(); }}
              disabled={loadingOptions}
              placeholder="Digite ou selecione a oficina"
              options={workshops.map((workshop) => ({ value: String(workshop.id), label: workshop.name, disabled: workshop.canRequestTechnician === false }))}
            />
            {errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3"><CalendarDays className="h-4 w-4" /><h3 className="text-sm font-semibold">Período</h3></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="startDate">Data inicial</Label><DateInput id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />{errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}</div>
              <div className="space-y-2"><Label htmlFor="endDate">Data final</Label><DateInput id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />{errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={quantityType} onValueChange={(v) => { setQuantityType(v as "carros" | "dias"); markDirty(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="carros">Carros</SelectItem><SelectItem value="dias">Dias</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" inputMode="numeric" value={quantity} disabled={quantityType === "carros"} onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>
          </div>

          <div className="space-y-2"><Label htmlFor="notes">Observações</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" rows={4} /></div>

          <div className="flex justify-end"><Button type="submit" disabled={submitting || loadingOptions || workshopMissingAddress}>{submitting ? "Salvando..." : "Criar solicitação"}</Button></div>
        </section>
      </form>
    </AppLayout>
  );
}
