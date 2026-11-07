import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, ClipboardList, X, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serviceService } from "@/services/serviceService";
import { userService } from "@/services/userService";
import { formatDate } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { SERVICE_STATUS_CLASS, SERVICE_STATUS_LABEL } from "@/utils/serviceStatus";
import { COMMON_COUNTRIES } from "@/constants/countries";
import type { Service, ServiceStatus } from "@/types/service";
import type { UserSelectionItem } from "@/types/user";

const PER_PAGE = 20;
const DELETABLE_STATUSES: ServiceStatus[] = ["aguardando", "aceito", "cancelado"];
const LIST_STATUSES: ServiceStatus[] = ["aguardando", "aceito", "em_execucao", "finalizado", "cancelado"];

function ServiceActions({ service, open, deleting, onOpenChange, onEdit, onDelete }: {
  service: Service;
  open: boolean;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const canDelete = service.status != null && DELETABLE_STATUSES.includes(service.status);
  const menuId = `service-actions-${service.id}`;

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) onOpenChange(false);
    }
    function close() { onOpenChange(false); }
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open, onOpenChange]);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition({
      top: rect.bottom + 96 > window.innerHeight ? rect.top - 88 : rect.bottom,
      left: Math.max(8, Math.min(rect.right - 160, window.innerWidth - 168)),
    });
    onOpenChange(true);
  }

  return (
    <div className="inline-block text-left" onMouseLeave={() => onOpenChange(false)} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && !menuRef.current?.contains(event.relatedTarget)) onOpenChange(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); triggerRef.current?.focus(); }
    }}>
      <button ref={triggerRef} type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent" aria-label={`Ações do serviço ${service.id}`} aria-expanded={open} aria-controls={open ? menuId : undefined} onMouseEnter={openMenu} onClick={openMenu}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={menuId} role="group" aria-label={`Ações do serviço ${service.id}`} className="fixed z-50 w-40 py-1" style={position}>
          <div className="rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
            <button type="button" className="flex w-full items-center rounded px-3 py-2 text-sm hover:bg-accent" onClick={() => { onOpenChange(false); onEdit(); }}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </button>
            <button type="button" disabled={deleting || !canDelete} title={canDelete ? "Excluir serviço" : "Exclusão disponível apenas para serviços abertos, aceitos ou cancelados"} className="flex w-full items-center rounded px-3 py-2 text-sm text-destructive hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40" onClick={() => { onOpenChange(false); onDelete(); }}>
              <Trash2 className="mr-2 h-4 w-4" />Deletar
            </button>
          </div>
        </div>, document.body,
      )}
    </div>
  );
}

type StatusFilter = "all" | ServiceStatus;

export default function ServicosList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<string>("all");
  const [workshop, setWorkshop] = useState<string>("all");
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [city, setCity] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [openActionsId, setOpenActionsId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedCity(city);
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, city]);

  useEffect(() => {
    userService.listForSelection("OFICINA")
      .then(setWorkshops)
      .catch(() => { /* Filtro opcional: a listagem continua disponível. */ });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      if (startDate && endDate && endDate < startDate) {
        setServices([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const response = await serviceService.list({
          page,
          per_page: PER_PAGE,
          status: status === "all" ? undefined : status,
          pais: country === "all" ? undefined : country,
          oficina_id: workshop === "all" ? undefined : Number(workshop),
          cidade: debouncedCity.trim() || undefined,
          data_inicial: startDate || undefined,
          data_final: endDate || undefined,
          busca: debouncedSearch.trim() || undefined,
        });
        if (cancelled) return;

        setServices(response.data);
        setLastPage(response.meta.last_page);
        setTotal(response.meta.total);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, [page, status, country, workshop, debouncedCity, startDate, endDate, debouncedSearch, reloadToken]);

  async function deleteService(id: number) {
    setDeletingId(id);
    try {
      const message = await serviceService.remove(id);
      toast.success(message);
      if (services.length === 1 && page > 1) setPage((current) => current - 1);
      else setReloadToken((current) => current + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  }

  const invalidDateRange = Boolean(startDate && endDate && endDate < startDate);
  function clearFilters() {
    setSearch("");
    setStatus("all");
    setCountry("all");
    setWorkshop("all");
    setCity("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }
  function money(value: number, currency: string | null): string {
    const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : "EUR";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: code }).format(value);
  }

  return (
    <AppLayout title="Serviços" subtitle={`${total} solicitação(ões) encontrada(s)`}>
      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => { if (!open && deletingId === null) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              O serviço será excluído definitivamente. As perícias permanecerão no histórico, sem vínculo com o serviço. Registros financeiros existentes serão preservados e, nesse caso, a exclusão não será permitida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deletingId !== null} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(event) => { event.preventDefault(); if (pendingDeleteId !== null) void deleteService(pendingDeleteId); }}>
              {deletingId !== null ? "Excluindo..." : "Confirmar exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <Button variant="outline" onClick={() => navigate("/servicos/novo")}>
          <ClipboardList className="w-4 h-4 mr-2" />
          Criar solicitação
        </Button>
        <Button onClick={() => navigate("/servicos/criar")}>
          <Plus className="w-4 h-4 mr-2" />
          Criar serviço
        </Button>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-55">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por oficina, criador, cidade ou código"
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-47.5">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {LIST_STATUSES.map((k) => (
              <SelectItem key={k} value={k}>
                {SERVICE_STATUS_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={country}
          onValueChange={(v) => {
            setCountry(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os países</SelectItem>
            {COMMON_COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-end gap-3 basis-full">
          <div className="min-w-45 flex-1 space-y-1"><Label>Oficina</Label>
            <Select value={workshop} onValueChange={(v) => { setWorkshop(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Todas as oficinas" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as oficinas</SelectItem>{workshops.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-40 flex-1 space-y-1"><Label>Cidade</Label><Input placeholder="Filtrar cidade" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div className="min-w-40 space-y-1"><Label>Data inicial</Label><DateInput value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} /></div>
          <div className="min-w-40 space-y-1"><Label>Data final</Label><DateInput min={startDate || undefined} value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} /></div>
          <Button type="button" variant="outline" onClick={clearFilters}><X className="w-4 h-4 mr-1" />Limpar</Button>
        </div>
      </div>
      {invalidDateRange && <p className="text-sm text-destructive mb-4">A data final não pode ser anterior à inicial.</p>}

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-245">
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Oficina</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>País</TableHead>
              <TableHead className="text-right">Preço da oficina (total)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-14 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id} onClick={() => navigate(`/servicos/${s.id}`)} className="cursor-pointer hover:bg-accent/50">
                  <TableCell className="font-medium text-foreground whitespace-nowrap">
                    {formatDate(s.serviceDate ?? s.startDate ?? s.createdAt?.slice(0, 10))}

                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.workshop ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.workshopCity ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.workshopCountry ?? "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{money(
                    s.calculatedPrices?.carro?.oficina != null
                      ? s.calculatedPrices.carro.oficina + (s.calculatedPrices.desmontagem?.oficina ?? 0)
                      : s.totalAmount,
                    s.currency,
                  )}</TableCell>
                  <TableCell>
                    {s.status ? (
                      <Badge variant="outline" className={SERVICE_STATUS_CLASS[s.status]}>
                        {SERVICE_STATUS_LABEL[s.status]}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <ServiceActions
                      service={s}
                      open={openActionsId === s.id}
                      deleting={deletingId === s.id}
                      onOpenChange={(open) => setOpenActionsId((current) => open ? s.id : current === s.id ? null : current)}
                      onEdit={() => navigate(`/servicos/${s.id}`)}
                      onDelete={() => setPendingDeleteId(s.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && services.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Página {page} de {lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
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
    </AppLayout>
  );
}
