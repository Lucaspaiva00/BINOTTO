import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { payableService } from "@/services/payableService";
import { userService } from "@/services/userService";
import type { Payable, PayablePayload, FinanceOrigin, FinanceStatus } from "@/types/finance";
import type { UserSelectionItem } from "@/types/user";
import { PAYABLE_CATEGORIES, PAYMENT_METHODS } from "@/constants/finance";
import { formatCurrency } from "@/utils/currency";
import { endOfMonth, formatDate, startOfMonth, todayISO } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import { PAGE_SIZE, StatusBadge, OriginBadge, techName, shopName } from "./shared";

interface PayableForm {
  id?: number;
  origin: FinanceOrigin;
  serviceId: number | null;
  technicianId: string;
  workshopId: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  supplier: string;
  category: string;
  paymentMethod: string;
  settleDate: string;
  notes: string;
  entryDate: string;
  emissionDate: string;
  dueDate: string;
  status: FinanceStatus;
}

function emptyForm(): PayableForm {
  return {
    origin: "aplicativo",
    serviceId: null,
    technicianId: "",
    workshopId: "",
    description: "",
    amountDue: 0,
    amountPaid: 0,
    supplier: "",
    category: "",
    paymentMethod: "",
    settleDate: "",
    notes: "",
    entryDate: todayISO(),
    emissionDate: "",
    dueDate: todayISO(),
    status: "pendente",
  };
}

function toForm(p: Payable): PayableForm {
  return {
    id: p.id,
    origin: p.origin,
    serviceId: p.serviceId,
    technicianId: p.technicianId != null ? String(p.technicianId) : "",
    workshopId: p.workshopId != null ? String(p.workshopId) : "",
    description: p.description,
    amountDue: p.amountDue,
    amountPaid: p.amountPaid,
    supplier: p.supplier ?? "",
    category: p.category ?? "",
    paymentMethod: p.paymentMethod ?? "",
    settleDate: p.settleDate ?? "",
    notes: p.notes ?? "",
    entryDate: p.launchDate ?? todayISO(),
    emissionDate: p.issueDate ?? "",
    dueDate: p.dueDate,
    status: p.status,
  };
}

function toPayload(form: PayableForm): PayablePayload {
  const base = {
    origem: form.origin,
    servico_id: form.serviceId,
    descricao: form.description,
    data_vencimento: form.dueDate,
    status: form.status,
  };

  if (form.origin === "avulsa") {
    return {
      ...base,
      valor_a_pagar: form.amountDue,
      valor_pago: form.amountDue,
      fornecedor: form.supplier || null,
      categoria: form.category || null,
      forma_pagamento: form.paymentMethod || null,
      data_emissao: form.emissionDate || null,
      data_pagamento: form.settleDate || null,
      observacoes: form.notes || null,
    };
  }

  return {
    ...base,
    tecnico_id: form.technicianId ? Number(form.technicianId) : null,
    oficina_id: form.workshopId ? Number(form.workshopId) : null,
    valor_a_pagar: form.amountDue,
    valor_pago: form.amountPaid,
    data_lancamento: form.entryDate,
  };
}

const FIELD_MAP: Record<string, string> = {
  origem: "origin",
  servico_id: "serviceId",
  tecnico_id: "technicianId",
  oficina_id: "workshopId",
  descricao: "description",
  valor_a_pagar: "amountDue",
  valor_pago: "amountPaid",
  fornecedor: "supplier",
  categoria: "category",
  forma_pagamento: "paymentMethod",
  data_emissao: "emissionDate",
  data_pagamento: "settleDate",
  observacoes: "notes",
  data_lancamento: "entryDate",
  data_vencimento: "dueDate",
  status: "status",
};

export function Payables() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(endOfMonth());
  const [techFilter, setTechFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState<"all" | FinanceOrigin>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FinanceStatus>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PayableForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

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

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);

      try {
        const response = await payableService.list({
          page,
          per_page: PAGE_SIZE,
          data_de: from || undefined,
          data_ate: to || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          origem: originFilter === "all" ? undefined : originFilter,
          busca: debouncedQuery.trim() || undefined,
          tecnico_id: techFilter === "all" ? undefined : Number(techFilter),
          oficina_id: shopFilter === "all" ? undefined : Number(shopFilter),
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
  }, [page, from, to, originFilter, statusFilter, techFilter, shopFilter, debouncedQuery, reloadToken]);

  function openNew() {
    setErrors({});
    setEditing(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(item: Payable) {
    setErrors({});
    setEditing(toForm(item));
    setDialogOpen(true);
  }

  async function save() {
    if (!editing) return;

    setSaving(true);
    setErrors({});

    try {
      const payload = toPayload(editing);

      if (editing.id) {
        await payableService.update(editing.id, payload);
        toast.success("Lançamento atualizado.");
      } else {
        await payableService.create(payload);
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
      const { message } = await payableService.remove(id);
      toast.success(message);
      setReloadToken((n) => n + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // Totais calculados
  const totalToPay = items
    .filter((p) => p.status === "pendente" || p.status === "em_aberto" || p.status === "vencido")
    .reduce((acc, p) => acc + p.amountDue, 0);
  const totalPaid = items
    .filter((p) => p.status === "confirmado" || p.status === "pago")
    .reduce((acc, p) => acc + p.amountDue, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total a pagar</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">{formatCurrency(totalToPay)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total pago</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <DateInput
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <DateInput
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={originFilter}
            onValueChange={(v) => {
              setOriginFilter(v as "all" | FinanceOrigin);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aplicativo">Aplicativo</SelectItem>
              <SelectItem value="avulsa">Avulsa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Técnico</Label>
          <Select
            value={techFilter}
            onValueChange={(v) => {
              setTechFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Oficina</Label>
          <Select
            value={shopFilter}
            onValueChange={(v) => {
              setShopFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {workshops.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as "all" | FinanceStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="em_aberto">Em aberto</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Descrição" />
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo lançamento
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden md:table-cell">Técnico / Fornecedor</TableHead>
              <TableHead className="hidden lg:table-cell">Oficina (pagou)</TableHead>
              <TableHead>Valor a pagar</TableHead>
              <TableHead className="hidden lg:table-cell">Valor pago</TableHead>
              <TableHead className="hidden xl:table-cell">Lançamento</TableHead>
              <TableHead className="hidden md:table-cell">Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right sticky right-0 bg-card z-10 border-l border-border">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  Nenhum lançamento.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <OriginBadge origin={p.origin} />
                  </TableCell>
                  <TableCell className="font-medium">{p.description}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {p.origin === "avulsa" ? (p.supplier ?? "-") : techName(technicians, p.technicianId)}
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell">
                    {p.origin === "avulsa" ? (p.paymentMethod ?? "-") : shopName(workshops, p.workshopId)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(p.amountDue)}</TableCell>
                  <TableCell className="font-medium hidden lg:table-cell whitespace-nowrap">
                    {formatCurrency(p.amountPaid)}
                  </TableCell>
                  <TableCell className="text-sm hidden xl:table-cell whitespace-nowrap">
                    {formatDate(p.origin === "avulsa" ? p.issueDate : p.launchDate)}
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell whitespace-nowrap">
                    {formatDate(p.dueDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-card z-10 border-l border-border">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(p.id)}>Excluir</AlertDialogAction>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conta a Pagar</DialogTitle>
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
                    <Label>Fornecedor</Label>
                    <Input
                      value={editing.supplier}
                      onChange={(e) => setEditing({ ...editing, supplier: e.target.value })}
                    />
                    {errors.supplier && <p className="text-xs text-destructive">{errors.supplier}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYABLE_CATEGORIES.map((c) => (
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
                      value={editing.amountDue}
                      onChange={(value) => setEditing({ ...editing, amountDue: value })}
                    />
                    {errors.amountDue && <p className="text-xs text-destructive">{errors.amountDue}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
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
                    <Label>Data de pagamento</Label>
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
                        <SelectItem value="pago">Pago</SelectItem>
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
                  <div className="col-span-2 space-y-2">
                    <Label>Descrição do serviço</Label>
                    <Input
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Técnico (quem recebeu)</Label>
                    <Select
                      value={editing.technicianId}
                      onValueChange={(v) => setEditing({ ...editing, technicianId: v })}
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
                    {errors.technicianId && <p className="text-xs text-destructive">{errors.technicianId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Oficina (quem pagou)</Label>
                    <Select
                      value={editing.workshopId}
                      onValueChange={(v) => setEditing({ ...editing, workshopId: v })}
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
                    {errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Valor a pagar</Label>
                    <CurrencyInput
                      value={editing.amountDue}
                      onChange={(value) => setEditing({ ...editing, amountDue: value })}
                    />
                    {errors.amountDue && <p className="text-xs text-destructive">{errors.amountDue}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Valor pago pela plataforma</Label>
                    <CurrencyInput
                      value={editing.amountPaid}
                      onChange={(value) => setEditing({ ...editing, amountPaid: value })}
                    />
                    {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid}</p>}
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
                        <SelectItem value="confirmado">Confirmado / Pago</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                  </div>
                </>
              )}
            </div>
          )}
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
