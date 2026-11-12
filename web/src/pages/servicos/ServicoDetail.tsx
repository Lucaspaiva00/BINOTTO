import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Eye, Save, FileText, CheckCircle2, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { serviceService } from "@/services/serviceService";
import { userService } from "@/services/userService";
import { formatDateTime } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { PERICIA_STATUS_CLASS, PERICIA_STATUS_LABEL } from "@/utils/periciaStatus";

import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { PericiaStatus } from "@/types/pericia";
import type { PartInspection } from "@/types/carParts";
import type { Service, ServiceStatus } from "@/types/service";
import type { UserSelectionItem } from "@/types/user";
import {
  ServiceAdminForm,
  formatEditableDecimal,
  type ServiceAdminFormState,
} from "./ServiceAdminForm";
import { pdfPending } from "./servicePdf";
import { ServicePartDialog } from "./ServicePartDialog";
import { emptyVehiclePhotos, pricesFromService, buildServiceDetailsFormData, normalizeServiceRepairs, validateDetails, localTodayISO } from "./serviceDetails";

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
    registeredTechnician: Boolean(service.technicianId),
    manualTechnicianName: service.manualTechnicianName ?? "",
    serviceDate: service.serviceDate ?? service.startDate ?? service.createdAt?.slice(0, 10) ?? localTodayISO(),
    plate: service.licensePlate ?? "",
    chassis: service.chassis ?? "",
    model: service.model ?? "",
    // Serviços anteriores guardavam um único campo marca_modelo: preserve o texto ao editar.
    brand: service.brand ?? (service.model?.split(" ")[0] ?? ""),
    vehicleModel: service.vehicleModel ?? (service.brand ? "" : service.model?.split(" ").slice(1).join(" ") ?? ""),
    vehiclePhotos: { ...emptyVehiclePhotos(), ...service.vehiclePhotos },
    inspectionType: service.inspectionType ?? "simples",
    detailedPrices: pricesFromService(service),
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
  const openForEdit = useLocation().state?.edit === true;
  const [service, setService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceAdminFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [partsState, setPartsState] = useState<Record<string, PartInspection>>({});
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<PartInspection | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [editingFinalized, setEditingFinalized] = useState(false);
  const [confirmation, setConfirmation] = useState<"edit" | "cancel" | null>(null);
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
        setPartsState(normalizeServiceRepairs(data.vehicleRepairs));
        setTechnicians(techs);
        setWorkshops(shops);
        setEditingFinalized(openForEdit);
        markSaved();
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, markSaved, openForEdit]);


  const lockedByStatus = service ? ["finalizado", "concluido", "recusado", "cancelado"].includes(service.status ?? "") : false;
  const editingEnabled = !lockedByStatus || editingFinalized;
  const isFinalized = service?.status === "finalizado" || service?.status === "concluido";
  const finalizedStatus: ServiceStatus = service?.status === "concluido" ? "concluido" : "finalizado";

  const statusOptions: ServiceStatus[] | undefined = isFinalized && editingFinalized
    ? [finalizedStatus, "aguardando", "cancelado"]
    : undefined;

  function requestEditFinalized() {
    if (!lockedByStatus) return;
    setConfirmation("edit");
  }

  function change<K extends keyof ServiceAdminFormState>(field: K, value: ServiceAdminFormState[K]) {
    if (!editingEnabled) return;
    setForm((current) => {
      if (!current) return current;
      const next = { ...current, [field]: value };
      if (isFinalized && field === "status" && value === "aguardando") {
        return { ...next, technicianId: "", manualTechnicianName: "", registeredTechnician: false };
      }
      if (isFinalized && field === "status" && value === finalizedStatus && service) {
        return { ...next, technicianId: service.technicianId ? String(service.technicianId) : "", manualTechnicianName: service.manualTechnicianName ?? "", registeredTechnician: Boolean(service.technicianId) };
      }
      if (field === "technicianId" && (value !== current.technicianId || current.manualTechnicianName)) {
        next.manualTechnicianName = "";
        next.registeredTechnician = Boolean(value);
        if (isFinalized) next.status = "aguardando";
        else if (["aguardando", "aguardando_aprovacao", "recusado", "cancelado"].includes(current.status)) {
          next.status = value ? "aguardando_aprovacao" : "aguardando";
        }
      }
      return next;
    });
    markDirty();
  }

  async function persist(finalize = false, nextStatus?: Service["status"]): Promise<Service | null> {
    if (!form || (!editingEnabled && !finalize)) return null;
    const next: Record<string, string> = {};
    const detailError = validateDetails(form, partsState);
    if (detailError) { toast.error(detailError); return null; }
    if (!form.workshopId) next.workshopId = "Selecione a oficina.";
    if (!form.serviceDate) next.serviceDate = "Informe a data do serviço.";
    setErrors(next);
    if (Object.keys(next).length) return null;
    const completed = await serviceService.saveDetails(id, buildServiceDetailsFormData(
      finalize ? { ...form, status: "finalizado" } : nextStatus ? { ...form, status: nextStatus } : form, partsState,
    ));
    setService(completed);
    setForm(formFromService(completed));
    setPartsState(normalizeServiceRepairs(completed.vehicleRepairs));
    markSaved();
    return completed;
  }

  async function save(finalize = false) {
    if (saving || actionBusy) return;
    if (isFinalized && form?.status === "cancelado") { setConfirmation("cancel"); return; }
    setSaving(true);
    try {
      const completed = await persist(finalize);
      if (!completed) return;
      toast.success(finalize ? "Serviço finalizado e enviado ao Financeiro." : "Serviço atualizado.");
      navigate("/servicos");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function changePart(id: string, next: PartInspection) {
    if (!editingEnabled) return;
    setPartsState(prev => ({ ...prev, [id]: next }));
    markDirty();
  }
  async function adminAction(type: "accept" | "refuse") {
    if (!service || !form || actionBusy || saving || !form.technicianId) return;
    setActionBusy(true);
    try {
      const saved = await persist();
      if (!saved) return;
      const updated = type === "accept"
        ? await serviceService.accept(saved.id, Number(form.technicianId))
        : await serviceService.refuse(saved.id);
      const fresh = await serviceService.show(updated.id);
      setService(fresh); setForm(formFromService(fresh));
      setPartsState(normalizeServiceRepairs(fresh.vehicleRepairs));
      setEditingFinalized(false);
      markSaved();
      toast.success(type === "accept" ? "Aceite registrado." : "Serviço recusado.");
    } catch (e) { toast.error(getApiErrorMessage(e)); } finally { setActionBusy(false); }
  }

  async function transition(status: "em_execucao" | "cancelado", confirmed = false) {
    if (saving || actionBusy) return;
    if (status === "cancelado" && !confirmed) { setConfirmation("cancel"); return; }
    setActionBusy(true);
    try { const saved = await persist(false, status); if (!saved) return; setEditingFinalized(false); toast.success(status === "cancelado" ? "Serviço cancelado." : "Serviço em execução."); if (status === "cancelado") navigate("/servicos"); }
    catch (e) { toast.error(getApiErrorMessage(e)); } finally { setActionBusy(false); }
  }

  if (loading) return <AppLayout title="Serviço"><div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div></AppLayout>;
  if (notFound || !service || !form) return <AppLayout title="Serviço" subtitle="Não encontrado"><Button variant="outline" onClick={() => navigate("/servicos")}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button></AppLayout>;

  return (
    <AppLayout title={`Serviço ${service.id}`} subtitle={[service.workshop, service.workshopCity, service.workshopCountry].filter(Boolean).join(" · ")}>
      <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !actionBusy) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation === "cancel" ? "Cancelar este serviço?" : "Editar serviço encerrado?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirmation === "cancel" ? (isFinalized ? "Os lançamentos financeiros vinculados serão cancelados e as perícias voltarão para Aberto." : "O serviço será marcado como Cancelado e deixará de estar em execução. Você poderá excluí-lo posteriormente, desde que não existam lançamentos financeiros vinculados.") : "Este serviço já foi encerrado. Alterações podem modificar informações registradas anteriormente. Deseja liberar a edição?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionBusy}>Voltar</AlertDialogCancel>
            <AlertDialogAction disabled={actionBusy} className={confirmation === "cancel" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""} onClick={(event) => { event.preventDefault(); const choice = confirmation; setConfirmation(null); if (choice === "edit") setEditingFinalized(true); if (choice === "cancel") void transition("cancelado", true); }}>
              {confirmation === "cancel" ? "Confirmar cancelamento" : "Liberar edição"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => { if (confirmDiscard()) navigate("/servicos"); }}><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={pdfPending}><FileText className="mr-2 size-4" />Gerar PDF</Button>
          {lockedByStatus && !editingFinalized
            ? <Button onClick={requestEditFinalized} variant="outline"><Pencil className="w-4 h-4 mr-2" />Editar</Button>
            : <Button onClick={() => void save()} disabled={saving || actionBusy}><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar alterações"}</Button>}
        </div>
      </div>

      <fieldset disabled={saving || actionBusy || !editingEnabled} className="min-w-0">
      <ServiceAdminForm value={form} onChange={change} workshops={workshops} technicians={technicians} partsState={partsState} errors={errors} fixedInvoice
        onPartSelect={editingEnabled ? (partId => {setSelectedPartId(partId);setEditingPart({...partsState[partId],photos:[...partsState[partId].photos]});}) : undefined}
        onPartChange={editingEnabled ? changePart : undefined} onAccept={editingEnabled ? (() => void adminAction("accept")) : undefined} onRefuse={editingEnabled ? (() => void adminAction("refuse")) : undefined}
        canAccept={editingEnabled && ["aguardando", "em_breve", "aguardando_aprovacao"].includes(form.status)} canRefuse={editingEnabled && ["aguardando", "em_breve", "aguardando_aprovacao"].includes(form.status)} actionBusy={actionBusy} statusOptions={statusOptions} partEditor={selectedPartId && <ServicePartDialog key={selectedPartId} partId={selectedPartId} value={editingPart} onClose={() => {setSelectedPartId(null);setEditingPart(null);}}
        onSave={part => {if(selectedPartId)changePart(selectedPartId,part);setSelectedPartId(null);setEditingPart(null);}}/>}
        />
      </fieldset>


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

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-4"><span>Criado em {formatDateTime(service.createdAt)}</span><span>Atualizado em {formatDateTime(service.updatedAt)}</span></div>
      {editingEnabled && <div className="mt-6 flex flex-wrap justify-end gap-3 border-t pt-4">
        <Button onClick={() => void save()} disabled={saving || actionBusy}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar alterações"}</Button>
        {!lockedByStatus && form.status === "em_execucao" && <Button className="bg-green-600 text-white hover:bg-green-700" disabled={saving || actionBusy} onClick={() => void save(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Finalizar serviço</Button>}
        {!lockedByStatus && form.status === "aceito" && <Button disabled={saving || actionBusy} onClick={() => void transition("em_execucao")}>Iniciar serviço</Button>}
        {!lockedByStatus && <Button variant="destructive" disabled={saving || actionBusy} onClick={() => void transition("cancelado")}>Cancelar serviço</Button>}
      </div>}
      <div className="mt-4 flex justify-end"><Button variant="outline" onClick={pdfPending}><FileText className="mr-2 size-4" />Gerar PDF</Button></div>
    </AppLayout>
  );
}
