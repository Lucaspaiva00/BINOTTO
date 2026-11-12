import { ColumnFilter } from "@/components/ui/column-filter";
import type { ReactNode } from "react";
import { InvoiceAttachment } from "./InvoiceAttachment";
import { FinanceRecordDetails } from "./FinanceRecordDetails";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Eye, Trash2, FileText, MessageCircle, Mail, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { receivableService } from "@/services/receivableService";
import { userService } from "@/services/userService";
import type { Receivable, ReceivablePayload, FinanceOrigin, FinanceStatus, FinanceInstallment } from "@/types/finance";
import type { UserSelectionItem } from "@/types/user";
import { RECEIVABLE_CATEGORIES, PAYMENT_METHODS } from "@/constants/finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate, todayISO } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import { PAGE_SIZE, shopName } from "./shared";

const dash = <Minus aria-hidden className="mx-auto size-4 text-muted-foreground" />;

function dot(color: "green" | "yellow" | "red", title: string) {
  const backgrounds = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500" };
  return <span title={title} role="img" aria-label={title} className={`mx-auto block size-3 rounded-full ${backgrounds[color]}`} />;
}

function invoiceCells(record: Receivable) {
  const hasInvoice = Boolean(record.invoiceNumber || record.invoiceAttachment || record.invoice || ["emitida", "enviada", "paga"].includes(record.invoiceStatus ?? ""));
  const installments = record.installments ?? [];
  const receivedAmount = installments.reduce((sum, part) => sum + Number(part.valor_pago ?? 0), 0);
  const received = ["recebido", "pago"].includes(record.status) || record.invoiceStatus === "paga"
    || (record.serviceAmount > 0 && receivedAmount >= record.serviceAmount);
  const partial = !received && receivedAmount > 0;
  const channels = record.invoiceChannels ?? [];
  const payment = record.technicianPayment;
  return <>
    <TableCell className="border-l text-center" title={hasInvoice ? "Fatura emitida" : "Sem fatura"}>{hasInvoice
      ? <FileText className="mx-auto size-4 text-emerald-500" aria-label="Fatura emitida" /> : dash}</TableCell>
    <TableCell className="text-center" title={channels.length ? "Canais de envio" : "Canal de envio não registrado"}>
      {channels.length ? <span className="inline-flex gap-1">
        {channels.includes("whatsapp") && <MessageCircle className="size-4 text-emerald-500" aria-label="WhatsApp" />}
        {channels.includes("email") && <Mail className="size-4 text-sky-500" aria-label="E-mail" />}
      </span> : dash}
    </TableCell>
    <TableCell className="text-center">{received ? dot("green", "Recebimento total") : partial ? dot("yellow", "Recebimento parcial") : dash}</TableCell>
    <TableCell className="text-center">{!(received || partial) || !payment ? dash : payment === "total"
      ? dot("green", "Técnicos pagos integralmente") : payment === "parcial"
      ? dot("yellow", "Pagamento parcial aos técnicos") : dot("red", "Pagamento aos técnicos pendente")}</TableCell>
  </>;
}

interface ReceivableForm {
  id?: number;
  origin: FinanceOrigin;
  workshopId: string;
  serviceId: number | null;
  serviceDate: string;
  brand: string;
  vehicleModel: string;
  plate: string;
  chassis: string;
  vehicleReferenceType: "placa" | "chassi";
  technician: string;
  description: string;
  serviceValue: number;
  platformValue: number;
  paidBy: string;
  client: string;
  category: string;
  paymentMethod: string;
  invoice: string;
  invoiceNumber: string;
  invoiceStatus: string;
  installments: FinanceInstallment[];
  settleDate: string;
  notes: string;
  entryDate: string;
  emissionDate: string;
  dueDate: string;
  status: FinanceStatus;
}

function emptyForm(): ReceivableForm {
  return {
    origin: "aplicativo",
    workshopId: "",
    serviceId: null,
    serviceDate: "", brand: "", vehicleModel: "", plate: "", chassis: "", vehicleReferenceType: "placa", technician: "",
    description: "",
    serviceValue: 0,
    platformValue: 0,
    paidBy: "",
    client: "",
    category: "",
    paymentMethod: "",
    invoice: "", invoiceNumber: "", invoiceStatus: "", installments: [],
    settleDate: "",
    notes: "",
    entryDate: todayISO(),
    emissionDate: "",
    dueDate: todayISO(),
    status: "pendente",
  };
}

function toForm(r: Receivable): ReceivableForm {
  return {
    id: r.id,
    origin: r.origin,
    workshopId: r.workshopId != null ? String(r.workshopId) : "",
    serviceId: r.serviceId,
    serviceDate: r.serviceDate ?? "",
    brand: r.brand ?? "",
    vehicleModel: r.vehicleModel ?? "",
    plate: r.plate ?? "",
    chassis: r.chassis ?? "",
    vehicleReferenceType: r.vehicleReferenceType ?? (r.plate ? "placa" : "chassi"),
    technician: r.technician ?? "",
    description: r.description,
    serviceValue: r.serviceAmount,
    platformValue: r.platformAmount,
    paidBy: r.paidBy ?? "",
    client: r.client ?? "",
    category: r.category ?? "",
    paymentMethod: r.paymentMethod ?? "",
    invoice: r.invoice ?? "",
    invoiceNumber: r.invoiceNumber ?? "",
    invoiceStatus: r.invoiceStatus ?? "",
    installments: r.installments ?? [],
    settleDate: r.receivedDate ?? "",
    notes: r.notes ?? "",
    entryDate: r.launchDate ?? todayISO(),
    emissionDate: r.issueDate ?? "",
    dueDate: r.dueDate,
    status: r.status,
  };
}

export function toPayload(form: ReceivableForm): ReceivablePayload {
  const base = {
    origem: form.origin,
    servico_id: form.serviceId,
    referencia_veiculo_tipo: form.vehicleReferenceType,
    descricao: form.description,
    data_vencimento: form.dueDate,
    fatura: form.invoice || null,
    numero_fatura: form.invoiceNumber || null,
    status_fatura: form.invoiceStatus || null,
    parcelas: form.installments,
    data_emissao: form.emissionDate || null,
    data_recebimento: form.settleDate || null,
    status: form.status,
  };

  if (form.origin === "avulsa") {
    return {
      ...base,
      valor_servico: form.serviceValue,
      valor_plataforma: form.serviceValue,
      cliente: form.client || null,
      categoria: form.category || null,
      forma_pagamento: form.paymentMethod || null,
      data_emissao: form.emissionDate || null,
      data_recebimento: form.settleDate || null,
      observacoes: form.notes || null,
    };
  }

  return {
    ...base,
    oficina_id: form.workshopId ? Number(form.workshopId) : null,
    valor_servico: form.serviceValue,
    valor_plataforma: form.platformValue,
    quem_pagou: form.paidBy || null,
    data_lancamento: form.entryDate,
  };
}

const FIELD_MAP: Record<string, string> = {
  origem: "origin",
  oficina_id: "workshopId",
  servico_id: "serviceId",
  referencia_veiculo_tipo: "vehicleReferenceType",
  descricao: "description",
  valor_servico: "serviceValue",
  valor_plataforma: "platformValue",
  quem_pagou: "paidBy",
  cliente: "client",
  categoria: "category",
  forma_pagamento: "paymentMethod",
  fatura: "invoice",
  numero_fatura: "invoiceNumber",
  status_fatura: "invoiceStatus",
  parcelas: "installments",
  data_emissao: "emissionDate",
  data_recebimento: "settleDate",
  observacoes: "notes",
  data_lancamento: "entryDate",
  data_vencimento: "dueDate",
  status: "status",
};

export function Receivables() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);

  const [viewing, setViewing] = useState<Receivable | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReceivableForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const shops = await userService.listForSelection("OFICINA");
        if (cancelled) return;

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

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);

      try {
        const response = await receivableService.list({
          page,
          per_page: PAGE_SIZE,
          ...filters,
          oficina_id: filters.oficina_id ? Number(filters.oficina_id) : undefined,
        });
        if (cancelled) return;

        setItems(response.data);
        setLastPage(response.meta.last_page);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [page, filters, reloadToken]);

  function openNew() {
    setErrors({});
    setEditing(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(item: Receivable) {
    setErrors({});
    setEditing(toForm(item));
    setDialogOpen(true);
  }

  async function save() {
    if (!editing) return;

    setSaving(true);
    setErrors({});

    try {
      if (editing.installments.length) {
        const total = editing.installments.reduce((sum, p) => sum + Number(p.valor), 0);
        if (Math.abs(total - editing.serviceValue) > 0.01 || editing.installments.some(p => !p.vencimento || p.valor <= 0 || (p.valor_pago ?? 0) > p.valor || ((p.valor_pago ?? 0) > 0 && !p.data_pagamento))) {
          setErrors({ installments: "Confira valores, vencimentos e datas de pagamento. A soma deve corresponder ao valor a receber." });
          setSaving(false);
          return;
        }
      }
      const payload = toPayload(editing);

      if (editing.id) {
        await receivableService.update(editing.id, payload);
        toast.success("Lançamento atualizado.");
      } else {
        await receivableService.create(payload);
        toast.success("Lançamento criado.");
      }

      setDialogOpen(false);
      setReloadToken((n) => n + 1);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);

      if (validationErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validationErrors)) {
          mapped[FIELD_MAP[field] ?? field] = message;
        }
        setErrors(mapped);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      // A exclusão do lançamento não deve apagar o serviço vinculado.
      const { message } = await receivableService.remove(id, false);
      toast.success(message);
      setReloadToken((n) => n + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // Valores da página carregada; não representam o total de todas as páginas.
  const today = todayISO();
  const paidAmount = (r: Receivable) => r.installments?.length
    ? r.installments.reduce((sum, part) => sum + Number(part.valor_pago ?? 0), 0)
    : (["confirmado", "recebido", "pago"].includes(r.status) ? r.serviceAmount : 0);
  const pendingAmount = (r: Receivable) => ["cancelado"].includes(r.status)
    ? 0 : Math.max(0, r.serviceAmount - paidAmount(r));
  const totalToReceive = items.reduce((sum, r) => sum + pendingAmount(r), 0);
  const totalReceived = items.reduce((sum, r) => sum + paidAmount(r), 0);
  const totalOverdue = items.reduce((sum, r) => {
    if (r.installments?.length) return sum + r.installments.reduce((sub, part) => sub + (part.vencimento < today ? Math.max(0, Number(part.valor) - Number(part.valor_pago ?? 0)) : 0), 0);
    return sum + (r.dueDate < today ? pendingAmount(r) : 0);
  }, 0);
  const totalUpcoming = Math.max(0, totalToReceive - totalOverdue);
  const pendingInvoices = items.filter(r => pendingAmount(r) > 0 && !(r.invoiceNumber || r.invoiceAttachment || r.invoice)).length;
  const receivedThisMonth = items.reduce((sum, r) => sum + (r.installments?.length
    ? r.installments.reduce((sub, part) => sub + (part.data_pagamento?.slice(0, 7) === today.slice(0, 7) ? Number(part.valor_pago ?? 0) : 0), 0)
    : r.receivedDate?.slice(0, 7) === today.slice(0, 7) ? paidAmount(r) : 0), 0);

  function filter(label: string, keys: string[], fields: ReactNode) {
    return <ColumnFilter label={label} active={keys.some(key => Boolean(filters[key]))} onApply={data => {
      const next = { ...filters };
      for (const key of keys) {
        const value = String(data?.get(key) ?? "").trim();
        if (value) next[key] = value;
        else delete next[key];
      }
      if (next.servico_de && next.servico_ate && next.servico_de > next.servico_ate) return "Confira o intervalo de datas.";
      if (next.valor_de && next.valor_ate && Number(next.valor_de) > Number(next.valor_ate)) return "Confira o intervalo de valores.";
      setPage(1);
      setFilters(next);
    }}>{fields}</ColumnFilter>;
  }

  function textFilter(label: string, key: string) {
    return filter(label, [key], <Input name={key} aria-label={label} defaultValue={filters[key]} />);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Indicadores dos {items.length} lançamentos exibidos nesta página. Os filtros e a paginação limitam os totais.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Saldo a receber", value: formatCurrency(totalToReceive), tone: "text-amber-500" },
          { label: "Total recebido", value: formatCurrency(totalReceived), tone: "text-emerald-500" },
          { label: "Vencido", value: formatCurrency(totalOverdue), tone: "text-red-500" },
          { label: "A vencer", value: formatCurrency(totalUpcoming), tone: "text-foreground" },
          { label: "Sem fatura", value: String(pendingInvoices), tone: "text-foreground" },
          { label: "Recebido neste mês", value: formatCurrency(receivedThisMonth), tone: "text-emerald-500" },
        ].map(card => <div key={card.label} className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className={`text-xl md:text-2xl font-semibold mt-1 ${card.tone}`}>{card.value}</p>
        </div>)}
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="mr-1 size-4" /> Novo lançamento</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{filter("Data", ["servico_de", "servico_ate"], <>
                <DateInput name="servico_de" aria-label="De" defaultValue={filters.servico_de} />
                <DateInput name="servico_ate" aria-label="Até" defaultValue={filters.servico_ate} />
              </>)}</TableHead>
              <TableHead>{textFilter("Modelo", "veiculo")}</TableHead>
              <TableHead>{textFilter("Placa / Chassi", "referencia")}</TableHead>
              <TableHead>{filter("Oficina / Cliente", ["oficina_id", "origem"], <>
                <select className="w-full rounded border bg-background p-2" name="oficina_id" defaultValue={filters.oficina_id ?? ""} aria-label="Oficina">
                  <option value="">Todas as oficinas</option>
                  {workshops.map(workshop => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
                </select>
                <select className="w-full rounded border bg-background p-2" name="origem" defaultValue={filters.origem ?? ""} aria-label="Origem">
                  <option value="">Todas as origens</option><option value="aplicativo">Aplicativo</option><option value="avulsa">Avulsa</option>
                </select>
              </>)}</TableHead>
              <TableHead>{textFilter("Técnico", "tecnico")}</TableHead>
              <TableHead>{filter("Valor a receber", ["valor_de", "valor_ate"], <>
                <Input name="valor_de" aria-label="Valor mínimo" type="number" min="0" step="0.01" defaultValue={filters.valor_de} />
                <Input name="valor_ate" aria-label="Valor máximo" type="number" min="0" step="0.01" defaultValue={filters.valor_ate} />
              </>)}</TableHead>
              <TableHead className="border-l text-center">Fatura</TableHead>
              <TableHead className="text-center">Enviada</TableHead>
              <TableHead className="text-center">{filter("Recebida", ["status"], <select className="w-full rounded border bg-background p-2" name="status" defaultValue={filters.status ?? ""} aria-label="Status">
                <option value="">Todos os status</option><option value="pendente">Pendente</option><option value="confirmado">Confirmado</option>
                <option value="em_aberto">Em aberto</option><option value="recebido">Recebido</option><option value="pago">Pago</option>
                <option value="vencido">Vencido</option><option value="cancelado">Cancelado</option>
              </select>)}</TableHead>
              <TableHead className="text-center">Paga</TableHead>
              <TableHead className="text-right sticky right-0 bg-card z-10 border-l border-border">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  Nenhum lançamento.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id} onClick={(e) => { if (!(e.target as HTMLElement).closest("button, a")) setViewing(r); }} className="cursor-pointer whitespace-nowrap hover:bg-accent/50">
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(r.serviceDate ?? r.issueDate ?? r.launchDate ?? r.dueDate)}</TableCell>
                  <TableCell>{[r.brand, r.vehicleModel].filter(Boolean).join(" ") || r.description || "—"}</TableCell><TableCell>{r.vehicleReference || r.plate || r.chassis || "—"}</TableCell>
                  <TableCell className="text-sm">{r.origin === "avulsa" ? (r.client ?? "—") : ((r.workshop || shopName(workshops, r.workshopId)).replace(/\s+carro[cç]eria\b/gi, ""))}</TableCell>
                  <TableCell title={r.technician ?? undefined}>{r.technician?.trim().split(/\s+/)[0] || "—"}</TableCell><TableCell className="whitespace-nowrap font-medium">{formatCurrency(r.serviceAmount)}</TableCell>
                  {invoiceCells(r)}
                  <TableCell className="text-right sticky right-0 bg-card z-10 border-l border-border">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" aria-label="Ver detalhes" onClick={(e) => { e.stopPropagation(); setViewing(r); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" aria-label="Excluir lançamento" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                            <AlertDialogDescription>O lançamento financeiro será excluído definitivamente. O serviço vinculado, se houver, será preservado. Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => { e.stopPropagation(); void remove(r.id); }}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Página {page} de {lastPage}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <FinanceRecordDetails kind="receber" record={viewing} workshops={workshops}
        onClose={() => setViewing(null)} onEdit={() => { if (viewing) { openEdit(viewing); setViewing(null); } }} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conta a Receber</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Tipo de lançamento</Label>
                <Select
                  value={editing.origin}
                  onValueChange={(v) =>
                    setEditing({
                      ...editing,
                      origin: v as FinanceOrigin,
                      status: v === "avulsa" ? "em_aberto" : "pendente",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aplicativo">Aplicativo</SelectItem>
                    <SelectItem value="avulsa">Avulsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editing.origin === "avulsa" ? (
                <>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} />
                    {errors.client && <p className="text-xs text-destructive">{errors.client}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECEIVABLE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <CurrencyInput
                      value={editing.serviceValue}
                      onChange={(value) => setEditing({ ...editing, serviceValue: value })}
                    />
                    {errors.serviceValue && <p className="text-xs text-destructive">{errors.serviceValue}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de recebimento</Label>
                    <Select
                      value={editing.paymentMethod}
                      onValueChange={(v) => setEditing({ ...editing, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de emissão</Label>
                    <DateInput
                      value={editing.emissionDate}
                      onChange={(e) => setEditing({ ...editing, emissionDate: e.target.value })}
                    />
                    {errors.emissionDate && <p className="text-xs text-destructive">{errors.emissionDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de vencimento</Label>
                    <DateInput
                      value={editing.dueDate}
                      onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                    />
                    {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de recebimento</Label>
                    <DateInput
                      value={editing.settleDate}
                      onChange={(e) => setEditing({ ...editing, settleDate: e.target.value })}
                    />
                    {errors.settleDate && <p className="text-xs text-destructive">{errors.settleDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editing.status}
                      onValueChange={(v) => setEditing({ ...editing, status: v as FinanceStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_aberto">Em aberto</SelectItem>
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={editing.notes}
                      onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                      rows={3}
                    />
                    {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2 rounded-xl border bg-muted/30 p-4">
                    <p className="mb-3 text-sm font-semibold">Dados do serviço</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                      <div><span className="text-muted-foreground">Data</span><p>{editing.serviceDate ? formatDate(editing.serviceDate) : "—"}</p></div>
                      <div><span className="text-muted-foreground">Marca / Modelo</span><p>{[editing.brand, editing.vehicleModel].filter(Boolean).join(" ") || "—"}</p></div>
                      <div><span className="text-muted-foreground">Técnico</span><p>{editing.technician || "—"}</p></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Referência do veículo</Label>
                    <Select value={editing.vehicleReferenceType} onValueChange={(v) => setEditing({ ...editing, vehicleReferenceType: v as "placa" | "chassi" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="placa">Placa</SelectItem><SelectItem value="chassi">Chassi</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Referência</Label><Input readOnly value={editing.vehicleReferenceType === "chassi" ? editing.chassis : editing.plate} /></div>
                  <div className="col-span-2 grid gap-3 md:grid-cols-3">
                    <div className="space-y-2"><Label>Fatura da oficina</Label><Input value={editing.invoice} onChange={(e) => setEditing({ ...editing, invoice: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Nº da fatura</Label><Input value={editing.invoiceNumber} onChange={(e) => setEditing({ ...editing, invoiceNumber: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Status da fatura</Label><Select value={editing.invoiceStatus || "pendente"} onValueChange={v => setEditing({...editing, invoiceStatus:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="emitida">Emitida</SelectItem><SelectItem value="enviada">Enviada ao cliente</SelectItem><SelectItem value="paga">Paga pelo cliente</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="space-y-2"><Label>Data de emissão da fatura</Label><DateInput value={editing.emissionDate} onChange={e => setEditing({...editing, emissionDate:e.target.value})}/></div>
                  <div className="col-span-2 space-y-2">
                    <Label>Descrição do serviço</Label>
                    <Input
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Oficina (quem pagou)</Label>
                    <Select value={editing.workshopId} onValueChange={(v) => setEditing({ ...editing, workshopId: v })}>
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
                    {errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do serviço</Label>
                    <CurrencyInput
                      value={editing.serviceValue}
                      onChange={(value) => setEditing({ ...editing, serviceValue: value })}
                    />
                    {errors.serviceValue && <p className="text-xs text-destructive">{errors.serviceValue}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Valor recebido pela plataforma</Label>
                    <CurrencyInput
                      value={editing.platformValue}
                      onChange={(value) => setEditing({ ...editing, platformValue: value })}
                    />
                    {errors.platformValue && <p className="text-xs text-destructive">{errors.platformValue}</p>}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Quem pagou</Label>
                    <Input
                      value={editing.paidBy}
                      onChange={(e) => setEditing({ ...editing, paidBy: e.target.value })}
                      placeholder="Plataforma ou nome da oficina"
                    />
                    {errors.paidBy && <p className="text-xs text-destructive">{errors.paidBy}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data do lançamento</Label>
                    <DateInput
                      value={editing.entryDate}
                      onChange={(e) => setEditing({ ...editing, entryDate: e.target.value })}
                    />
                    {errors.entryDate && <p className="text-xs text-destructive">{errors.entryDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de vencimento</Label>
                    <DateInput
                      value={editing.dueDate}
                      onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                    />
                    {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de recebimento</Label>
                    <DateInput value={editing.settleDate} onChange={(e) => setEditing({ ...editing, settleDate: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editing.status}
                      onValueChange={(v) => setEditing({ ...editing, status: v as FinanceStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado / Recebido</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                  </div>
                </>
              )}
            </div>
          )}
          {editing && <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between items-center gap-2"><div><Label>Parcelas da fatura</Label><p className="text-xs text-muted-foreground">Vencimentos e pagamentos individuais</p></div><Button size="sm" variant="outline" onClick={() => setEditing({...editing,installments:[...editing.installments,{numero:editing.installments.length+1,valor:Math.max(0,Math.round((editing.serviceValue-editing.installments.reduce((a,p)=>a+Number(p.valor),0))*100)/100),vencimento:editing.dueDate||todayISO(),valor_pago:0,data_pagamento:null}]})}>Adicionar parcela</Button></div>
            {editing.installments.map((inst,index)=><div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-2 border border-border rounded-lg p-2">
              <div><Label className="text-xs">Parcela</Label><Input readOnly value={index+1}/></div>
              <div><Label className="text-xs">Valor (€)</Label><Input type="number" step="0.01" min="0" value={inst.valor} onChange={e=>setEditing({...editing,installments:editing.installments.map((p,i)=>i===index?{...p,valor:Number(e.target.value)}:p)})}/></div>
              <div><Label className="text-xs">Vencimento</Label><DateInput value={inst.vencimento} onChange={e=>setEditing({...editing,installments:editing.installments.map((p,i)=>i===index?{...p,vencimento:e.target.value}:p)})}/></div>
              <div><Label className="text-xs">Recebido (€)</Label><Input type="number" step="0.01" min="0" value={inst.valor_pago??0} onChange={e=>setEditing({...editing,installments:editing.installments.map((p,i)=>i===index?{...p,valor_pago:Number(e.target.value)}:p)})}/></div>
              <div><Label className="text-xs">Data pagamento</Label><DateInput value={inst.data_pagamento??""} onChange={e=>setEditing({...editing,installments:editing.installments.map((p,i)=>i===index?{...p,data_pagamento:e.target.value||null}:p)})}/></div>
              <Button className="col-span-2 md:col-span-5 justify-self-end" size="sm" variant="ghost" onClick={()=>setEditing({...editing,installments:editing.installments.filter((_,i)=>i!==index).map((p,i)=>({...p,numero:i+1}))})}>Remover parcela</Button>
            </div>)}
            {editing.installments.length>0&&<p className="text-xs">Total parcelado: {formatCurrency(editing.installments.reduce((a,p)=>a+Number(p.valor),0))} / {formatCurrency(editing.serviceValue)}</p>}
            {errors.installments&&<p className="text-sm text-destructive">{errors.installments}</p>}
          </div>}
          {editing?.id && <InvoiceAttachment kind="receber" id={editing.id} attached={items.find(item => item.id === editing.id)?.invoiceAttachment} onUploaded={() => { setReloadToken(n => n + 1); } } />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
