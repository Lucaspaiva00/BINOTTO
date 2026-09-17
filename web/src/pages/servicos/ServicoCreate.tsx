import { useEffect, useMemo, useState } from "react";
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
import type { UserSelectionItem } from "@/types/user";
import { ServiceAdminForm, parseDecimalInput, type ServiceAdminFormState } from "./ServiceAdminForm";

const INITIAL: ServiceAdminFormState = {
  workshopId: "",
  status: "aguardando",
  technicianId: "",
  plate: "",
  chassis: "",
  model: "",
  price: "0",
  compensationType: "none",
  compensationValue: "0",
  notes: "",
};

export default function ServicoCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ServiceAdminFormState>(INITIAL);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { markDirty, markSaved, confirmDiscard } = useUnsavedChanges();
  const partsState = useMemo(() => createInitialPartsState(), []);

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
    const price = parseDecimalInput(form.price);
    const compensation = parseDecimalInput(form.compensationValue);
    if (!form.workshopId) next.workshopId = "Selecione a oficina.";
    if (!Number.isFinite(price) || price < 0) next.price = "Informe um preço válido, inclusive zero se necessário.";
    if (form.compensationType !== "none" && (!Number.isFinite(compensation) || compensation < 0)) next.compensationValue = "Informe um valor válido.";
    if (form.compensationType === "porcentagem" && compensation > 100) next.compensationValue = "A porcentagem não pode ser maior que 100%.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const created = await serviceService.createDirect({
        oficina_id: Number(form.workshopId),
        tecnico_id: form.technicianId ? Number(form.technicianId) : null,
        status: form.status,
        placa: form.plate.trim() || null,
        chassi: form.chassis.trim() || null,
        marca_modelo: form.model.trim() || null,
        valor_total: price,
        remuneracao_tipo: form.compensationType === "none" ? null : form.compensationType,
        remuneracao_tecnico: form.compensationType === "none" ? null : compensation,
        observacoes: form.notes.trim() || null,
      });
      markSaved();
      toast.success(`Serviço #${created.id} criado.`);
      navigate(`/servicos/${created.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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
      <ServiceAdminForm value={form} onChange={change} workshops={workshops} technicians={technicians} partsState={partsState} errors={errors} />
    </AppLayout>
  );
}
