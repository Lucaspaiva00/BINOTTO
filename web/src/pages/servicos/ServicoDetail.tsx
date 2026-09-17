import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Building2, Cog, Eye, Save, Wrench } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { serviceService } from "@/services/serviceService";
import { userService } from "@/services/userService";
import { SERVICE_STATUS_CLASS, SERVICE_STATUS_LABEL } from "@/utils/serviceStatus";
import { formatDateTime } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getServiceLogFields } from "./serviceLogFields";
import { PERICIA_STATUS_CLASS, PERICIA_STATUS_LABEL } from "@/utils/periciaStatus";
import { createInitialPartsState } from "@/utils/normalizeReparos";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { PericiaStatus } from "@/types/pericia";
import type { PartInspection, RepairType } from "@/types/carParts";
import type { Service, ServiceLog, ServiceVehicleRepair } from "@/types/service";
import type { UserSelectionItem } from "@/types/user";
import {
  ServiceAdminForm,
  formatEditableDecimal,
  parseDecimalInput,
  type ServiceAdminFormState,
} from "./ServiceAdminForm";

function formatLogDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function logActor(log: ServiceLog): { name: string; role: string; icon: typeof Wrench } {
  if (log.technician) return { name: log.technician, role: "Técnico", icon: Wrench };
  if (log.workshop) return { name: log.workshop, role: "Oficina", icon: Building2 };
  return { name: "Sistema", role: "Sistema", icon: Cog };
}

function normalizeServiceRepairs(repairs: ServiceVehicleRepair[] = []): Record<string, PartInspection> {
  const result = createInitialPartsState();
  for (const repair of repairs) {
    const id = repair.peca;
    if (!id || !result[id]) continue;
    result[id] = {
      ...result[id],
      repairType: (repair.tipoReparo ?? "SEM_DANO") as RepairType,
      dentCount: repair.quantidadeAmassados ?? 0,
      impactsOver25: repair.quantidadeImpactosMaior25 ?? 0,
      impactsUnder25: repair.quantidadeImpactosMenor25 ?? 0,
      notes: repair.observacoes ?? "",
      photos: repair.fotos ?? [],
    };
  }
  return result;
}

function formFromService(service: Service): ServiceAdminFormState {
  const compensationType = service.technicianPercentage !== null
    ? "porcentagem"
    : service.technicianAmount !== null
      ? "valor"
      : "none";

  return {
    workshopId: service.workshopId ? String(service.workshopId) : "",
    status: service.status ?? "aguardando",
    technicianId: service.technicianId ? String(service.technicianId) : "",
    plate: service.licensePlate ?? "",
    chassis: service.chassis ?? "",
    model: service.model ?? "",
    price: formatEditableDecimal(service.totalAmount),
    compensationType,
    compensationValue: formatEditableDecimal(
      compensationType === "porcentagem" ? service.technicianPercentage : service.technicianAmount,
    ),
    notes: service.notes ?? "",
  };
}

export default function ServicoDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceAdminFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const { markDirty, markSaved, confirmDiscard } = useUnsavedChanges();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [data, techs, shops] = await Promise.all([
          serviceService.show(id),
          userService.listForSelection("TECNICO"),
          userService.listForSelection("OFICINA"),
        ]);
        if (cancelled) return;
        setService(data);
        setForm(formFromService(data));
        setTechnicians(techs);
        setWorkshops(shops);
        markSaved();
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, markSaved]);

  const partsState = useMemo(() => normalizeServiceRepairs(service?.vehicleRepairs ?? []), [service?.vehicleRepairs]);

  function change<K extends keyof ServiceAdminFormState>(field: K, value: ServiceAdminFormState[K]) {
    setForm((current) => current ? { ...current, [field]: value } : current);
    markDirty();
  }

  async function save() {
    if (!form) return;
    const next: Record<string, string> = {};
    const price = parseDecimalInput(form.price);
    const compensation = parseDecimalInput(form.compensationValue);
    if (!form.workshopId) next.workshopId = "Selecione a oficina.";
    if (!Number.isFinite(price) || price < 0) next.price = "Informe um preço válido, inclusive zero.";
    if (form.compensationType !== "none" && (!Number.isFinite(compensation) || compensation < 0)) next.compensationValue = "Informe um valor válido.";
    if (form.compensationType === "porcentagem" && compensation > 100) next.compensationValue = "A porcentagem não pode ser maior que 100%.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const updated = await serviceService.update(id, {
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
      setService(updated);
      setForm(formFromService(updated));
      markSaved();
      toast.success("Serviço atualizado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLayout title="Serviço"><div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div></AppLayout>;
  if (notFound || !service || !form) return <AppLayout title="Serviço" subtitle="Não encontrado"><Button variant="outline" onClick={() => navigate("/servicos")}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button></AppLayout>;

  return (
    <AppLayout title={`Serviço ${service.id}`} subtitle={[service.workshop, service.workshopCity, service.workshopCountry].filter(Boolean).join(" · ")}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => { if (confirmDiscard()) navigate("/servicos"); }}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
        <div className="flex items-center gap-2">
          {service.status && <Badge variant="outline" className={SERVICE_STATUS_CLASS[service.status]}>{SERVICE_STATUS_LABEL[service.status]}</Badge>}
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar alterações"}</Button>
        </div>
      </div>

      <ServiceAdminForm value={form} onChange={change} workshops={workshops} technicians={technicians} partsState={partsState} errors={errors} />

      {service.inspections && service.inspections.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-6 mt-4">
          <h2 className="text-base font-semibold text-foreground mb-4">Perícias</h2>
          <div className="space-y-2">
            {service.inspections.map((inspection) => (
              <div key={inspection.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{inspection.publicNumber || `#${inspection.id}`}</span>
                  {inspection.licensePlate && <span className="text-sm text-muted-foreground">{inspection.licensePlate}</span>}
                  {inspection.status && <Badge variant="outline" className={PERICIA_STATUS_CLASS[inspection.status as PericiaStatus]}>{PERICIA_STATUS_LABEL[inspection.status as PericiaStatus]}</Badge>}
                </div>
                <Button variant="outline" size="sm" asChild><Link to={`/pericias/${inspection.id}`}><Eye className="w-4 h-4 mr-1" />Ver perícia</Link></Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {service.logs && service.logs.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-6 mt-4">
          <h2 className="text-base font-semibold text-foreground mb-6">Histórico do serviço</h2>
          <div className="relative pl-8">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-8">
              {service.logs.map((log) => {
                const actor = logActor(log);
                const Icon = actor.icon;
                const payloadFields = getServiceLogFields(log);
                return (
                  <div key={log.id} className="relative">
                    <div className="absolute top-0 left-0 -translate-x-1/2 w-8 h-8 rounded-full bg-[hsl(var(--app-accent))] text-black flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                    <div className="ml-4">
                      <p className="text-xs text-muted-foreground">{formatLogDateTime(log.createdAt)}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{log.description ?? log.type ?? "Evento"}</p>
                      <p className="text-xs text-muted-foreground">{actor.name} · {actor.role}</p>
                      {log.reason && <p className="text-xs text-muted-foreground mt-1">Motivo: {log.reason}</p>}
                      {payloadFields.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{payloadFields.map((field) => <div key={field.label} className="bg-muted/40 border border-border rounded-lg px-3 py-2"><p className="text-[11px] text-muted-foreground">{field.label}</p><p className="text-sm text-foreground">{field.value}</p></div>)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-4"><span>Criado em {formatDateTime(service.createdAt)}</span><span>Atualizado em {formatDateTime(service.updatedAt)}</span></div>
    </AppLayout>
  );
}
