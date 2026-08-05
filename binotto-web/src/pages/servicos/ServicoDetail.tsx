import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Wrench, Building2, Cog } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DateInput } from "@/components/ui/date-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { serviceService } from "@/services/serviceService";
import { receivableService } from "@/services/receivableService";
import { payableService } from "@/services/payableService";
import { userService } from "@/services/userService";
import { SERVICE_STATUS_CLASS, SERVICE_STATUS_LABEL } from "@/utils/serviceStatus";
import { formatDateTime, todayISO } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import { getServiceLogFields } from "./serviceLogFields";
import type { Service, ServiceLog } from "@/types/service";
import type { FinanceStatus, ReceivablePayload, PayablePayload } from "@/types/finance";
import type { UserSelectionItem } from "@/types/user";

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

interface ReceivableForm {
  workshopId: string;
  description: string;
  serviceValue: number;
  platformValue: number;
  paidBy: string;
  entryDate: string;
  dueDate: string;
  status: FinanceStatus;
}

interface PayableForm {
  technicianId: string;
  workshopId: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  entryDate: string;
  dueDate: string;
  status: FinanceStatus;
}

const RECEIVABLE_FIELD_MAP: Record<string, string> = {
  oficina_id: "workshopId",
  descricao: "description",
  valor_servico: "serviceValue",
  valor_plataforma: "platformValue",
  quem_pagou: "paidBy",
  data_lancamento: "entryDate",
  data_vencimento: "dueDate",
  status: "status",
};

const PAYABLE_FIELD_MAP: Record<string, string> = {
  descricao: "description",
  tecnico_id: "technicianId",
  oficina_id: "workshopId",
  valor_a_pagar: "amountDue",
  valor_pago: "amountPaid",
  data_lancamento: "entryDate",
  data_vencimento: "dueDate",
  status: "status",
};

export default function ServicoDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);

  const [receivableOpen, setReceivableOpen] = useState(false);
  const [receivableForm, setReceivableForm] = useState<ReceivableForm | null>(null);
  const [receivableErrors, setReceivableErrors] = useState<Record<string, string>>({});
  const [savingReceivable, setSavingReceivable] = useState(false);

  const [payableOpen, setPayableOpen] = useState(false);
  const [payableForm, setPayableForm] = useState<PayableForm | null>(null);
  const [payableErrors, setPayableErrors] = useState<Record<string, string>>({});
  const [savingPayable, setSavingPayable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      setLoading(true);
      setNotFound(false);

      try {
        const data = await serviceService.show(id);
        if (cancelled) return;

        setService(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadService();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [techs, shops] = await Promise.all([
          userService.listForSelection("TECNICO"),
          userService.listForSelection("OFICINA"),
        ]);
        if (cancelled) return;

        setTechnicians(techs);
        setWorkshops(shops);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  function openReceivable() {
    if (!service) return;

    const workshopId = workshops.find((w) => w.name === service.workshop)?.id;

    setReceivableErrors({});
    setReceivableForm({
      workshopId: workshopId ? String(workshopId) : "",
      description: `Serviço ${service.id}`,
      serviceValue: 0,
      platformValue: service.totalAmount,
      paidBy: "",
      entryDate: todayISO(),
      dueDate: todayISO(),
      status: "pendente",
    });
    setReceivableOpen(true);
  }

  function openPayable() {
    if (!service) return;

    const technicianId = technicians.find((t) => t.name === service.technician)?.id;
    const workshopId = workshops.find((w) => w.name === service.workshop)?.id;

    setPayableErrors({});
    setPayableForm({
      technicianId: technicianId ? String(technicianId) : "",
      workshopId: workshopId ? String(workshopId) : "",
      description: `Serviço ${service.id}`,
      amountDue: 0,
      amountPaid: service.totalAmount,
      entryDate: todayISO(),
      dueDate: todayISO(),
      status: "pendente",
    });
    setPayableOpen(true);
  }

  async function saveReceivable() {
    if (!receivableForm) return;

    setSavingReceivable(true);
    setReceivableErrors({});

    try {
      const payload: ReceivablePayload = {
        origem: "aplicativo",
        oficina_id: receivableForm.workshopId ? Number(receivableForm.workshopId) : null,
        servico_id: service?.id ?? null,
        descricao: receivableForm.description,
        valor_servico: receivableForm.serviceValue,
        valor_plataforma: receivableForm.platformValue,
        quem_pagou: receivableForm.paidBy || null,
        data_lancamento: receivableForm.entryDate,
        data_vencimento: receivableForm.dueDate,
        status: receivableForm.status,
      };

      await receivableService.create(payload);
      toast.success("Conta a receber criada.");
      setReceivableOpen(false);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);

      if (validationErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validationErrors)) {
          mapped[RECEIVABLE_FIELD_MAP[field] ?? field] = message;
        }
        setReceivableErrors(mapped);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setSavingReceivable(false);
    }
  }

  async function savePayable() {
    if (!payableForm) return;

    setSavingPayable(true);
    setPayableErrors({});

    try {
      const payload: PayablePayload = {
        origem: "aplicativo",
        servico_id: service?.id ?? null,
        tecnico_id: payableForm.technicianId ? Number(payableForm.technicianId) : null,
        oficina_id: payableForm.workshopId ? Number(payableForm.workshopId) : null,
        descricao: payableForm.description,
        valor_a_pagar: payableForm.amountDue,
        valor_pago: payableForm.amountPaid,
        data_lancamento: payableForm.entryDate,
        data_vencimento: payableForm.dueDate,
        status: payableForm.status,
      };

      await payableService.create(payload);
      toast.success("Conta a pagar criada.");
      setPayableOpen(false);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);

      if (validationErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validationErrors)) {
          mapped[PAYABLE_FIELD_MAP[field] ?? field] = message;
        }
        setPayableErrors(mapped);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setSavingPayable(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Serviço">
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !service) {
    return (
      <AppLayout title="Serviço" subtitle="Não encontrado">
        <Button variant="outline" onClick={() => navigate("/servicos")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Serviço ${service.id}`}
      subtitle={[service.workshop, service.workshopCity, service.workshopCountry].filter(Boolean).join(" · ")}
    >
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate("/servicos")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={openReceivable}>Conta a Receber</Button>
          <Button onClick={openPayable}>Conta a Pagar</Button>
          {service.status && (
            <Badge variant="outline" className={SERVICE_STATUS_CLASS[service.status]}>
              {SERVICE_STATUS_LABEL[service.status]}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {[
          { label: "Criado por", value: service.createdBy },
          { label: "Oficina", value: service.workshop },
          { label: "Local", value: [service.workshopCity, service.workshopCountry].filter(Boolean).join(" · ") },
          { label: "Técnico", value: service.technician },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className="text-sm font-medium text-foreground">{c.value || "—"}</p>
          </div>
        ))}
      </div>

      {service.logs && service.logs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
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
                    <div className="absolute top-0 left-0 -translate-x-1/2 w-8 h-8 rounded-full bg-[hsl(var(--app-accent))] text-black flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="ml-4">
                      <p className="text-xs text-muted-foreground">{formatLogDateTime(log.createdAt)}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {log.description ?? log.type ?? "Evento"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {actor.name} · {actor.role}
                      </p>
                      {log.reason && <p className="text-xs text-muted-foreground mt-1">Motivo: {log.reason}</p>}

                      {payloadFields.length > 0 && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {payloadFields.map((f) => (
                            <div key={f.label} className="bg-muted/40 border border-border rounded-lg px-3 py-2">
                              <p className="text-[11px] text-muted-foreground">{f.label}</p>
                              <p className="text-sm text-foreground">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Criado em {formatDateTime(service.createdAt)}</span>
        <span>Atualizado em {formatDateTime(service.updatedAt)}</span>
      </div>

      <Dialog open={receivableOpen} onOpenChange={setReceivableOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conta a Receber</DialogTitle>
          </DialogHeader>
          {receivableForm && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Descrição do serviço</Label>
                <Input
                  value={receivableForm.description}
                  onChange={(e) => setReceivableForm({ ...receivableForm, description: e.target.value })}
                />
                {receivableErrors.description && (
                  <p className="text-xs text-destructive">{receivableErrors.description}</p>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Oficina (quem pagou)</Label>
                <Select
                  value={receivableForm.workshopId}
                  onValueChange={(v) => setReceivableForm({ ...receivableForm, workshopId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {receivableErrors.workshopId && (
                  <p className="text-xs text-destructive">{receivableErrors.workshopId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor do serviço</Label>
                <CurrencyInput
                  value={receivableForm.serviceValue}
                  onChange={(value) => setReceivableForm({ ...receivableForm, serviceValue: value })}
                />
                {receivableErrors.serviceValue && (
                  <p className="text-xs text-destructive">{receivableErrors.serviceValue}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor recebido pela plataforma</Label>
                <CurrencyInput
                  value={receivableForm.platformValue}
                  onChange={(value) => setReceivableForm({ ...receivableForm, platformValue: value })}
                  disabled
                />
                {receivableErrors.platformValue && (
                  <p className="text-xs text-destructive">{receivableErrors.platformValue}</p>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Quem pagou</Label>
                <Input
                  value={receivableForm.paidBy}
                  onChange={(e) => setReceivableForm({ ...receivableForm, paidBy: e.target.value })}
                  placeholder="Plataforma ou nome da oficina"
                />
                {receivableErrors.paidBy && <p className="text-xs text-destructive">{receivableErrors.paidBy}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data do lançamento</Label>
                <DateInput
                  value={receivableForm.entryDate}
                  onChange={(e) => setReceivableForm({ ...receivableForm, entryDate: e.target.value })}
                />
                {receivableErrors.entryDate && (
                  <p className="text-xs text-destructive">{receivableErrors.entryDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Data de vencimento</Label>
                <DateInput
                  value={receivableForm.dueDate}
                  onChange={(e) => setReceivableForm({ ...receivableForm, dueDate: e.target.value })}
                />
                {receivableErrors.dueDate && <p className="text-xs text-destructive">{receivableErrors.dueDate}</p>}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Status</Label>
                <Select
                  value={receivableForm.status}
                  onValueChange={(v) => setReceivableForm({ ...receivableForm, status: v as FinanceStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado / Recebido</SelectItem>
                  </SelectContent>
                </Select>
                {receivableErrors.status && <p className="text-xs text-destructive">{receivableErrors.status}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivableOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveReceivable} disabled={savingReceivable}>
              {savingReceivable ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payableOpen} onOpenChange={setPayableOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conta a Pagar</DialogTitle>
          </DialogHeader>
          {payableForm && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Descrição do serviço</Label>
                <Input
                  value={payableForm.description}
                  onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })}
                />
                {payableErrors.description && <p className="text-xs text-destructive">{payableErrors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label>Técnico (quem recebeu)</Label>
                <Select
                  value={payableForm.technicianId}
                  onValueChange={(v) => setPayableForm({ ...payableForm, technicianId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {payableErrors.technicianId && (
                  <p className="text-xs text-destructive">{payableErrors.technicianId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Oficina (quem pagou)</Label>
                <Select
                  value={payableForm.workshopId}
                  onValueChange={(v) => setPayableForm({ ...payableForm, workshopId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {payableErrors.workshopId && <p className="text-xs text-destructive">{payableErrors.workshopId}</p>}
              </div>
              <div className="space-y-2">
                <Label>Valor a pagar</Label>
                <CurrencyInput
                  value={payableForm.amountDue}
                  onChange={(value) => setPayableForm({ ...payableForm, amountDue: value })}
                />
                {payableErrors.amountDue && <p className="text-xs text-destructive">{payableErrors.amountDue}</p>}
              </div>
              <div className="space-y-2">
                <Label>Valor pago pela plataforma</Label>
                <CurrencyInput
                  value={payableForm.amountPaid}
                  onChange={(value) => setPayableForm({ ...payableForm, amountPaid: value })}
                  disabled
                />
                {payableErrors.amountPaid && <p className="text-xs text-destructive">{payableErrors.amountPaid}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data do lançamento</Label>
                <DateInput
                  value={payableForm.entryDate}
                  onChange={(e) => setPayableForm({ ...payableForm, entryDate: e.target.value })}
                />
                {payableErrors.entryDate && <p className="text-xs text-destructive">{payableErrors.entryDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data de vencimento</Label>
                <DateInput
                  value={payableForm.dueDate}
                  onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })}
                />
                {payableErrors.dueDate && <p className="text-xs text-destructive">{payableErrors.dueDate}</p>}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Status</Label>
                <Select
                  value={payableForm.status}
                  onValueChange={(v) => setPayableForm({ ...payableForm, status: v as FinanceStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado / Pago</SelectItem>
                  </SelectContent>
                </Select>
                {payableErrors.status && <p className="text-xs text-destructive">{payableErrors.status}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayableOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePayable} disabled={savingPayable}>
              {savingPayable ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
