import { useEffect, useRef, useState, type ReactNode } from "react";
import { ColumnFilter } from "@/components/ui/column-filter";
import { getServiceColumns, SERVICE_COLUMNS, type ServiceColumn } from "@/constants/servicePreferences";
import { pdfPending } from "./servicePdf";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, FileText, ClipboardList, Menu, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
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
      top: rect.bottom + 132 > window.innerHeight ? rect.top - 128 : rect.bottom,
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
        <Menu className="h-4 w-4" />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={menuId} role="group" aria-label={`Ações do serviço ${service.id}`} className="fixed z-50 w-40 py-1" style={position}>
          <div className="rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
            <button type="button" className="flex w-full items-center rounded px-3 py-2 text-sm hover:bg-accent" onClick={() => { onOpenChange(false); onEdit(); }}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </button>
            <button type="button" className="flex w-full items-center rounded px-3 py-2 text-sm hover:bg-accent" onClick={() => { onOpenChange(false); pdfPending(); }}>
              <FileText className="mr-2 h-4 w-4" />Gerar PDF
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

type FilterKey = "data_inicial" | "data_final" | "oficina_id" | "cidade" | "pais" | "preco_minimo" | "preco_maximo" | "status" | "tecnico" | "placa" | "chassi";

function WorkshopFilterOptions({ workshops, selected }: { workshops: UserSelectionItem[]; selected: string }) {
  const [search, setSearch] = useState("");
  const [value, setValue] = useState(selected);
  const matching = workshops.filter(workshop => workshop.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  return <>
    <Input aria-label="Buscar oficina" placeholder="Digite o nome da oficina" value={search} onChange={event => setSearch(event.target.value)} />
    <input type="hidden" name="oficina_id" value={value} />
    <div role="group" aria-label="Oficinas cadastradas" className="max-h-36 overflow-y-auto rounded-md border p-1">
      <button type="button" aria-pressed={!value} onClick={() => setValue("")} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent aria-pressed:bg-accent">Todas as oficinas</button>
      {matching.map(workshop => (
        <button key={workshop.id} type="button" aria-pressed={value === String(workshop.id)} onClick={() => setValue(String(workshop.id))}
          className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent aria-pressed:bg-accent">{workshop.name}</button>
      ))}
      {matching.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma oficina encontrada.</p>}
    </div>
  </>;
}

export default function ServicosList() {
  const navigate = useNavigate();
  const [columns] = useState(() => getServiceColumns().filter(column => column.visible));
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
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
    userService.listForSelection("OFICINA")
      .then(setWorkshops)
      .catch(() => { /* Filtro opcional: a listagem continua disponível. */ });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      setLoading(true);

      try {
        const response = await serviceService.list({
          page,
          per_page: PER_PAGE,
          ...filters,
          status: filters.status as ServiceStatus | undefined,
          oficina_id: filters.oficina_id ? Number(filters.oficina_id) : undefined,
          preco_minimo: filters.preco_minimo ? Number(filters.preco_minimo) : undefined,
          preco_maximo: filters.preco_maximo ? Number(filters.preco_maximo) : undefined,
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
  }, [page, filters, reloadToken]);

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

  function filterColumn(label: string, keys: FilterKey[], children: ReactNode) {
    return <ColumnFilter label={label} active={keys.some(key => Boolean(filters[key]))} onApply={data => {
      const next = { ...filters };
      for (const key of keys) {
        const value = String(data?.get(key) ?? "").trim();
        if (value) next[key] = value;
        else delete next[key];
      }
      if (next.data_inicial && next.data_final && next.data_final < next.data_inicial) {
        return "A data final não pode ser anterior à inicial.";
      }
      if (next.preco_minimo && next.preco_maximo && Number(next.preco_minimo) > Number(next.preco_maximo)) {
        return "O preço máximo deve ser maior ou igual ao mínimo.";
      }
      setPage(1);
      setFilters(next);
    }}>{children}</ColumnFilter>;
  }

  function money(value: number, currency: string | null): string {
    const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : "EUR";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: code }).format(value);
  }

  const headers: Partial<Record<ServiceColumn, ReactNode>> = {
    date: filterColumn("Data", ["data_inicial", "data_final"], <>
                <div className="space-y-1"><Label htmlFor="filter-start">Data inicial</Label><DateInput id="filter-start" name="data_inicial" defaultValue={filters.data_inicial} /></div>
                <div className="space-y-1"><Label htmlFor="filter-end">Data final</Label><DateInput id="filter-end" name="data_final" defaultValue={filters.data_final} /></div>
              </>),
    workshop: filterColumn("Oficina", ["oficina_id"], <WorkshopFilterOptions workshops={workshops} selected={filters.oficina_id ?? ""} />),
    technician: filterColumn("Técnico", ["tecnico"], <Input name="tecnico" aria-label="Técnico" defaultValue={filters.tecnico} />),
    plate: filterColumn("Placa", ["placa"], <Input name="placa" aria-label="Placa" defaultValue={filters.placa} />),
    chassis: filterColumn("Chassi", ["chassi"], <Input name="chassi" aria-label="Chassi" defaultValue={filters.chassi} />),
    city: filterColumn("Cidade", ["cidade"], <Input name="cidade" aria-label="Cidade" placeholder="Digite a cidade" defaultValue={filters.cidade} />),
    country: filterColumn("País", ["pais"], <>
                <Input name="pais" aria-label="País" list="filter-countries" placeholder="Selecione ou digite o país" defaultValue={filters.pais} />
                <datalist id="filter-countries">{COMMON_COUNTRIES.map(code => <option key={code} value={code} />)}</datalist>
              </>),
    billed: filterColumn("Preço faturado", ["preco_minimo", "preco_maximo"], <>
                <div className="space-y-1"><Label htmlFor="filter-min">Preço mínimo</Label><Input id="filter-min" type="number" min="0" step="0.01" name="preco_minimo" defaultValue={filters.preco_minimo} /></div>
                <div className="space-y-1"><Label htmlFor="filter-max">Preço máximo</Label><Input id="filter-max" type="number" min="0" step="0.01" name="preco_maximo" defaultValue={filters.preco_maximo} /></div>
              </>),
    status: filterColumn("Status", ["status"], <select aria-label="Status" name="status" defaultValue={filters.status ?? ""} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
                <option value="">Todos os status</option>
                {LIST_STATUSES.map(status => <option key={status} value={status}>{SERVICE_STATUS_LABEL[status]}</option>)}
              </select>),
  };

  function columnValue(service: Service, id: ServiceColumn): ReactNode {
    const car = service.calculatedPrices?.carro;
    const disassembly = service.calculatedPrices?.desmontagem;
    const billed = (car?.oficina ?? service.totalAmount) + (disassembly?.oficina ?? 0);
    const technician = car?.tecnico ?? service.technicianAmount;
    const amount = (value: number | null | undefined) => value == null ? "—" : money(value, service.currency);
    const values: Record<ServiceColumn, ReactNode> = {
      date: formatDate(service.serviceDate ?? service.startDate ?? service.createdAt?.slice(0, 10)),
      workshop: service.workshop, technician: service.technician, city: service.workshopCity, country: service.workshopCountry,
      billed: amount(billed), brand: service.brand, model: service.vehicleModel ?? service.model, plate: service.licensePlate,
      chassis: service.chassis, technicianPrice: amount(technician), disassembly: amount(disassembly?.oficina),
      technicianPercentage: service.technicianPercentage == null ? null : `${service.technicianPercentage}%`,
      commission: amount(billed - (technician ?? 0) - (disassembly?.tecnico ?? 0)), notes: service.notes,
      status: service.status && <Badge variant="outline" className={SERVICE_STATUS_CLASS[service.status]}>{SERVICE_STATUS_LABEL[service.status]}</Badge>,
    };
    return values[id] || "—";
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
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-245">
          <TableHeader>
            <TableRow>
              {columns.map(({ id }) => <TableHead key={id}>{headers[id] ?? SERVICE_COLUMNS[id]}</TableHead>)}
              <TableHead className="w-14 text-right">Menu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id} onClick={() => navigate(`/servicos/${s.id}`)} className="cursor-pointer hover:bg-accent/50">
                  {columns.map(({ id }) => <TableCell key={id} className="whitespace-nowrap">{columnValue(s, id)}</TableCell>)}
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <ServiceActions
                      service={s}
                      open={openActionsId === s.id}
                      deleting={deletingId === s.id}
                      onOpenChange={(open) => setOpenActionsId((current) => open ? s.id : current === s.id ? null : current)}
                      onEdit={() => navigate(`/servicos/${s.id}`, { state: { edit: true } })}
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
