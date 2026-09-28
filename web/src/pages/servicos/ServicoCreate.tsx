import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { serviceService } from "@/services/serviceService";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { createInitialPartsState } from "@/utils/normalizeReparos";
import type { PartInspection } from "@/types/carParts";
import { ServicePartDialog } from "./ServicePartDialog";
import { buildServiceDetailsFormData, validateDetails, parseAmount } from "./serviceDetails";
import type { UserSelectionItem } from "@/types/user";
import { ServiceAdminForm, initialServiceForm, type ServiceAdminFormState } from "./ServiceAdminForm";

const INITIAL: ServiceAdminFormState = initialServiceForm();

export default function ServicoCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ServiceAdminFormState>(INITIAL);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { markDirty, markSaved, confirmDiscard } = useUnsavedChanges();
  const [partsState, setPartsState] = useState<Record<string, PartInspection>>(createInitialPartsState);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<PartInspection | null>(null);
  function changePart(id: string, part: PartInspection) { setPartsState(current => ({ ...current, [id]: part })); markDirty(); }

  useEffect(() => {
    let cancelled = false;
    Promise.all([userService.listForSelection("OFICINA"), userService.listForSelection("TECNICO")])
      .then(([shops, techs]) => { if (!cancelled) { setWorkshops(shops); setTechnicians(techs); } })
      .catch((error) => { if (!cancelled) toast.error(getApiErrorMessage(error)); });
    return () => { cancelled = true; };
  }, []);

  function change<K extends keyof ServiceAdminFormState>(field: K, value: ServiceAdminFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    markDirty();
  }

  async function submit() {
    const next: Record<string, string> = {};
    const detailsError = validateDetails(form, partsState);
    if (detailsError) { toast.error(detailsError); return; }
    const carPrice = form.detailedPrices.oficina_carro;
    const techPrice = form.detailedPrices.tecnico_carro;
    const price = carPrice.tipo === "valor" ? parseAmount(carPrice.valor) : 0;
    const compensation = parseAmount(techPrice.valor);
    if (!form.workshopId) next.workshopId = "Selecione a oficina.";
    if (!Number.isFinite(price) || price < 0) next.price = "Informe um preço válido, inclusive zero se necessário.";
    if (!Number.isFinite(compensation) || compensation < 0) next.compensationValue = "Informe um valor válido.";
    if (techPrice.tipo === "porcentagem" && compensation > 100) next.compensationValue = "A porcentagem não pode ser maior que 100%.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    let createdId: number | null = null;
    try {
      const created = await serviceService.createDirect({
        oficina_id: Number(form.workshopId),
        tecnico_id: form.technicianId ? Number(form.technicianId) : null,
        status: form.status,
        placa: form.plate.trim() || null,
        chassi: form.chassis.trim() || null,
        marca_modelo: `${form.brand} ${form.vehicleModel}`.trim() || null,
        valor_total: price,
        remuneracao_tipo: techPrice.tipo,
        remuneracao_tecnico: compensation,
        observacoes: form.notes.trim() || null,
      });
      createdId = created.id;
      await serviceService.saveDetails(created.id, buildServiceDetailsFormData(form, partsState));
      markSaved();
      toast.success(`Serviço #${created.id} criado.`);
      navigate(`/servicos/${created.id}`);
    } catch (error) {
      if (createdId) {
        toast.warning(`Serviço #${createdId} foi criado, mas os detalhes não foram salvos. Abra o cadastro para completar.`);
        navigate(`/servicos/${createdId}`);
      } else toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Criar serviço" subtitle="Cadastro completo do serviço">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => { if (confirmDiscard()) navigate("/servicos"); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
        <Button onClick={submit} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Criar serviço"}</Button>
      </div>
      <ServiceAdminForm value={form} onChange={change} workshops={workshops} technicians={technicians} partsState={partsState} errors={errors}
        onPartSelect={id => { setSelectedPartId(id); setSelectedValue({ ...partsState[id], photos: [...partsState[id].photos] }); }}
        onPartChange={changePart} />
      <ServicePartDialog partId={selectedPartId} value={selectedValue} onClose={() => { setSelectedPartId(null); setSelectedValue(null); }}
        onSave={part => { if (selectedPartId) changePart(selectedPartId, part); setSelectedPartId(null); setSelectedValue(null); }} />
    </AppLayout>
  );
}
