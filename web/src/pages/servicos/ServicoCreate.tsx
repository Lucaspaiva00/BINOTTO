import { periciaService } from "@/services/periciaService";
import { buildPericiaFormData } from "@/utils/buildPericiaFormData";
import { Input } from "@/components/ui/input";
import { getVehicleReference, normalizeVehicleReference } from "@/constants/servicePreferences";
import type { ServiceStatus } from "@/types/service";
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
import type { PartInspection } from "@/types/carParts";
import { ServicePartDialog } from "./ServicePartDialog";
import { buildServiceDetailsFormData, createInitialServiceParts, validateDetails, parseAmount, resolveDetailedPrices, summarizeServiceParts } from "./serviceDetails";
import type { UserSelectionItem } from "@/types/user";
import { ServiceAdminForm, initialServiceForm, type ServiceAdminFormState } from "./ServiceAdminForm";

export default function ServicoCreate({ inspection = false }: { inspection?: boolean }) {
  const navigate = useNavigate();
  const back = inspection ? "/pericias" : "/servicos";
  const action = inspection ? "Criar perícia" : "Criar serviço";
  const [inspectorName, setInspectorName] = useState("");
  const [draft, setForm] = useState<ServiceAdminFormState>(initialServiceForm);
  const [manualRepairPrice, setManualRepairPrice] = useState(false);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { markDirty, markSaved, confirmDiscard } = useUnsavedChanges();
  const [partsState, setPartsState] = useState<Record<string, PartInspection>>(createInitialServiceParts);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<PartInspection | null>(null);
  const form = manualRepairPrice ? draft : {
    ...draft,
    detailedPrices: {
      ...draft.detailedPrices,
      oficina_carro: { ...draft.detailedPrices.oficina_carro, valor: String(summarizeServiceParts(partsState).total) },
    },
  };
  function changePart(id: string, part: PartInspection) { setPartsState(current => ({ ...current, [id]: part })); markDirty(); }

  useEffect(() => {
    let cancelled = false;
    Promise.all([userService.listForSelection("OFICINA"), userService.listForSelection("TECNICO")])
      .then(([shops, techs]) => { if (!cancelled) { setWorkshops(shops); setTechnicians(techs); } })
      .catch((error) => { if (!cancelled) toast.error(getApiErrorMessage(error)); });
    return () => { cancelled = true; };
  }, []);

  function change<K extends keyof ServiceAdminFormState>(field: K, value: ServiceAdminFormState[K]) {
    if (field === "detailedPrices" && (value as ServiceAdminFormState["detailedPrices"]).oficina_carro.valor !== form.detailedPrices.oficina_carro.valor) {
      setManualRepairPrice(true);
    }
    setForm((current) => ({ ...current, [field]: value, ...(field === "technicianId" ? { status: value ? "aguardando_aprovacao" as const : "aguardando" as const } : {}) }));
    markDirty();
  }

  async function submit(nextStatus: ServiceStatus = form.status) {
    if (saving) return;
    const next: Record<string, string> = {};
    const detailsError = validateDetails(form, partsState);
    if (detailsError) { toast.error(detailsError); return; }
    const techPrice = form.detailedPrices.tecnico_carro;
    const totals = resolveDetailedPrices(form.detailedPrices);
    if (!totals) { toast.error("Revise os percentuais e a base de cálculo dos preços."); return; }
    const price = totals.carro.oficina;
    const compensation = totals.carro.tecnico;
    const reference = getVehicleReference();
    if ((inspection || reference !== "chassi") && !normalizeVehicleReference(form.plate)) next.plate = "Informe a placa.";
    if ((inspection || reference !== "placa") && !normalizeVehicleReference(form.chassis)) next.chassis = "Informe o chassi.";
    if (!form.serviceDate) next.serviceDate = "Informe a data do serviço.";
    if (!form.workshopId) next.workshopId = "Selecione a oficina.";
    if (!Number.isFinite(price) || price < 0) next.price = "Informe um preço válido, inclusive zero se necessário.";
    if (!Number.isFinite(compensation) || compensation < 0) next.compensationValue = "Informe um valor válido.";
    if (techPrice.tipo === "porcentagem" && parseAmount(techPrice.valor) > 100) next.compensationValue = "A porcentagem não pode ser maior que 100%.";
    if (inspection && !inspectorName.trim()) next.inspector = "Informe o nome do perito.";
    if (inspection && !form.brand.trim()) next.brand = "Informe a marca.";
    if (inspection && !form.vehicleModel.trim()) next.vehicleModel = "Informe o modelo.";
    setErrors(next);
    if (Object.keys(next).length) { toast.error(Object.values(next)[0]); return; }

    setSaving(true);
    let createdId: number | null = null;
    try {
      if (inspection) {
        const photoSlots = {
          frente_motorista: "diagonalFrontDriver", traseira_carona: "diagonalRearPassenger",
          placa: "vehicle_plate", chassi: "vehicle_chassis", marca: "vehicle_brand", modelo: "vehicle_model",
        } as const;
        const photos = Object.fromEntries(Object.entries(photoSlots).map(([key, slot]) => {
          const photo = form.vehiclePhotos[key as keyof typeof photoSlots];
          return [slot, photo instanceof File ? photo : null];
        }));
        const created = await periciaService.create(buildPericiaFormData({
          workshopId: Number(form.workshopId),
          technicianId: form.technicianId ? Number(form.technicianId) : null,
          inspectorName,
          licensePlate: normalizeVehicleReference(form.plate),
          chassis: normalizeVehicleReference(form.chassis),
          model: `${form.brand} ${form.vehicleModel}`.trim(),
          brand: form.brand,
          vehicleModel: form.vehicleModel,
          tipo: form.inspectionType,
          includeValue: true,
          inspectionValue: price,
          suggestedPrice: null,
          disassemblyValue: totals.desmontagem.oficina,
          photos,
          completePhotos: {},
          partsState,
        }));
        markSaved();
        toast.success("Perícia criada.");
        navigate(`/pericias/${created.id}`);
        return;
      }
      const created = await serviceService.createDirect({
        oficina_id: Number(form.workshopId),
        data_servico: form.serviceDate,
        tecnico_nome_manual: form.technicianId ? null : form.manualTechnicianName.trim() || null,
        tecnico_id: form.technicianId ? Number(form.technicianId) : null,
        status: form.status,
        referencia_veiculo: reference,
        placa: normalizeVehicleReference(form.plate) || null,
        chassi: normalizeVehicleReference(form.chassis) || null,
        marca_modelo: `${form.brand} ${form.vehicleModel}`.trim() || null,
        valor_total: price,
        remuneracao_tipo: techPrice.tipo,
        remuneracao_tecnico: techPrice.tipo === "porcentagem" ? parseAmount(techPrice.valor) : compensation,
        observacoes: form.notes.trim() || null,
      });
      createdId = created.id;
      await serviceService.saveDetails(created.id, buildServiceDetailsFormData({ ...form, status: nextStatus }, partsState));
      markSaved();
      toast.success(`Serviço #${created.id} criado.`);
      navigate("/servicos");
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
    <AppLayout title={inspection ? "Nova perícia" : action}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => { if (confirmDiscard()) navigate(back); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
        <Button className="bg-black text-white hover:bg-neutral-800" onClick={() => void submit()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : action}</Button>
      </div>
      <fieldset disabled={saving} className="min-w-0">
      {inspection && <label className="mb-4 block max-w-md space-y-2">
        <span>Nome do perito</span>
        <Input value={inspectorName} onChange={event => { setInspectorName(event.target.value); markDirty(); }} required />
        {errors.inspector && <span className="text-destructive">{errors.inspector}</span>}
      </label>}
      <ServiceAdminForm value={form} onChange={change} workshops={workshops} technicians={technicians} partsState={partsState} errors={errors}
        fixedInvoice canAccept={!inspection && Boolean(form.technicianId) && form.status !== "aceito"}
        canRefuse={!inspection && Boolean(form.technicianId) && form.status !== "recusado"}
        onAccept={() => change("status", "aceito")} onRefuse={() => change("status", "recusado")}
        onPartSelect={id => { setSelectedPartId(id); setSelectedValue({ ...partsState[id], photos: [...partsState[id].photos] }); }}
        onPartChange={changePart} partEditor={selectedPartId && <ServicePartDialog key={selectedPartId} partId={selectedPartId} value={selectedValue} onClose={() => { setSelectedPartId(null); setSelectedValue(null); }}
        onSave={part => { if (selectedPartId) changePart(selectedPartId, part); setSelectedPartId(null); setSelectedValue(null); }} />}
        />
      </fieldset>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button className="bg-black text-white hover:bg-neutral-800" onClick={() => void submit()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : action}</Button>
        {!inspection && <><Button className="bg-green-700 text-white hover:bg-green-800" onClick={() => void submit("em_execucao")} disabled={saving}>Iniciar serviço</Button>
        <Button className="bg-orange-700 text-white hover:bg-orange-800" onClick={() => void submit("finalizado")} disabled={saving}>Carro finalizado</Button></>}
      </div>

    </AppLayout>
  );
}
