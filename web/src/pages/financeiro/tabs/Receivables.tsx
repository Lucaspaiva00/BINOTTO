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
import { receivableService } from "@/services/receivableService";
import { userService } from "@/services/userService";
import type { Receivable, ReceivablePayload, FinanceOrigin, FinanceStatus } from "@/types/finance";
import type { UserSelectionItem } from "@/types/user";
import { RECEIVABLE_CATEGORIES, PAYMENT_METHODS } from "@/constants/finance";
import { formatCurrency } from "@/utils/currency";
import { endOfMonth, formatDate, startOfMonth, todayISO } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import { PAGE_SIZE, StatusBadge, OriginBadge, shopName } from "./shared";

interface ReceivableForm {
  id?: number;
  origin: FinanceOrigin;
  workshopId: string;
  serviceId: number | null;
  description: string;
  serviceValue: number;
  platformValue: number;
  paidBy: string;
  client: string;
  category: string;
  paymentMethod: string;
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
    description: "",
    serviceValue: 0,
    platformValue: 0,
    paidBy: "",
    client: "",
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

function toForm(r: Receivable): ReceivableForm {
  return {
    id: r.id,
    origin: r.origin,
    workshopId: r.workshopId != null ? String(r.workshopId) : "",
    serviceId: r.serviceId,
    description: r.description,
    serviceValue: r.serviceAmount,
    platformValue: r.platformAmount,
    paidBy: r.paidBy ?? "",
    client: r.client ?? "",
    category: r.category ?? "",
    paymentMethod: r.paymentMethod ?? "",
    settleDate: r.receivedDate ?? "",
    notes: r.notes ?? "",
    entryDate: r.launchDate ?? todayISO(),
    emissionDate: r.issueDate ?? "",
    dueDate: r.dueDate,
    status: r.status,
  };
}

function toPayload(form: ReceivableForm): ReceivablePayload {
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
  descricao: "description",
  valor_servico: "serviceValue",
  valor_plataforma: "platformValue",
  quem_pagou: "paidBy",
  cliente: "client",
  categoria: "category",
  forma_pagamento: "paymentMethod",
  data_emissao: "emissionDate",
  data_recebimento: "settleDate",
  observacoes: "notes",
  data_lancamento: "entryDate",
  data_vencimento: "dueDate",
  status: "status",
};

export function Receivables() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(endOfMonth());
  const [shopFilter, setShopFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState<"all" | FinanceOrigin>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FinanceStatus>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReceivableForm | null>(null);
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
          data_de: from || undefined,
          data_ate: to || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          origem: originFilter === "all" ? undefined : originFilter,
          busca: debouncedQuery.trim() || undefined,
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
  }, [page, from, to, shopFilter, originFilter, statusFilter, debouncedQuery, reloadToken]);

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
      const { message } = await receivableService.remove(id);
      toast.success(message);
      setReloadToken((n) => n + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // Totais calculados
  const totalToReceive = items
    .filter((r) => r.status === "pendente" || r.status === "em_aberto" || r.status === "vencido")
    .reduce((acc, r) => acc + r.serviceAmount, 0);
  const totalReceived = items
    .filter((r) => r.status === "confirmado" || r.status === "recebido")
    .reduce((acc, r) => acc + r.serviceAmount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total a receber</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">{formatCurrency(totalToReceive)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total recebido</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">{formatCurrency(totalReceived)}</p>
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
              <SelectItem value="recebido">Recebido</SelectItem>
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
              <TableHead className="hidden md:table-cell">Oficina / Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden lg:table-cell">Plataforma</TableHead>
              <TableHead className="hidden xl:table-cell">Quem pagou / Forma</TableHead>
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
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <OriginBadge origin={r.origin} />
                  </TableCell>
                  <TableCell className="font-medium">{r.description}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {r.origin === "avulsa" ? (r.client ?? "-") : shopName(workshops, r.workshopId)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(r.serviceAmount)}</TableCell>
                  <TableCell className="font-medium hidden lg:table-cell whitespace-nowrap">
                    {formatCurrency(r.platformAmount)}
                  </TableCell>
                  <TableCell className="text-sm hidden xl:table-cell">
                    {r.origin === "avulsa" ? (r.paymentMethod ?? "-") : (r.paidBy ?? "-")}
                  </TableCell>
                  <TableCell className="text-sm hidden xl:table-cell whitespace-nowrap">
                    {formatDate(r.origin === "avulsa" ? r.issueDate : r.launchDate)}
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell whitespace-nowrap">
                    {formatDate(r.dueDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-card z-10 border-l border-border">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
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
                            <AlertDialogAction onClick={() => remove(r.id)}>Excluir</AlertDialogAction>
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
