import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, ScanSearch, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { periciaService } from "@/services/periciaService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { PERICIA_STATUS_CLASS, PERICIA_STATUS_LABEL } from "@/utils/periciaStatus";
import type { Pericia, PericiaStatus } from "@/types/pericia";

const PER_PAGE = 20;
type StatusFilter = "all" | PericiaStatus;

function displayValue(pericia: Pericia): number | null {
  return pericia.inspectionValue ?? pericia.suggestedPrice ?? null;
}

export default function PericiasList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<Pericia | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function loadPericias() {
      setLoading(true);
      try {
        const response = await periciaService.list({
          page,
          per_page: PER_PAGE,
          status: status === "all" ? undefined : status,
          data_inicial: startDate || undefined,
          data_final: endDate || undefined,
          busca: debouncedSearch.trim() || undefined,
        });
        if (cancelled) return;
        setPericias(response.data);
        setLastPage(response.meta.last_page);
        setTotal(response.meta.total);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPericias();
    return () => { cancelled = true; };
  }, [page, status, startDate, endDate, debouncedSearch]);

  async function deleteInspection() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await periciaService.remove(deleting.id);
      toast.success("Perícia excluída.");
      setPericias((current) => current.filter((p) => p.id !== deleting.id));
      setTotal((count) => Math.max(0, count - 1));
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeletingBusy(false);
    }
  }


  return (
    <AppLayout title="Perícias" subtitle={`${total} perícia(s) encontrada(s)`}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/pericias/novo")}><Plus className="w-4 h-4 mr-2" />Nova perícia</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-55">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nº da perícia, oficina ou placa" className="pl-9" />
        </div>

        <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.keys(PERICIA_STATUS_LABEL) as PericiaStatus[]).map((k) => <SelectItem key={k} value={k}>{PERICIA_STATUS_LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>

        <DateInput value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-40" aria-label="Data inicial" />
        <DateInput value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-40" aria-label="Data final" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Data</TableHead><TableHead>Oficina</TableHead><TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead className="whitespace-nowrap">Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Spinner className="w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : pericias.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground"><ScanSearch className="w-8 h-8 mx-auto mb-2 opacity-60" />Nenhuma perícia encontrada.</TableCell></TableRow>
            ) : pericias.map((p) => (
              <TableRow key={p.id} onClick={() => navigate(`/pericias/${p.id}`)} className="cursor-pointer hover:bg-accent/50">
                <TableCell className="whitespace-nowrap text-sm">{formatDateTime(p.createdAt)}</TableCell>
                <TableCell>{p.workshop || "—"}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{p.licensePlate || "—"}</TableCell>
                <TableCell>{p.model || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{formatCurrency(displayValue(p))}</TableCell>
                <TableCell className="whitespace-nowrap">{p.status ? <Badge variant="outline" className={PERICIA_STATUS_CLASS[p.status]}>{PERICIA_STATUS_LABEL[p.status]}</Badge> : "—"}</TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={`Ações da perícia ${p.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-40">
                      <DropdownMenuItem onSelect={() => navigate(`/pericias/${p.id}/editar`)}>
                        <Pencil className="mr-2 h-4 w-4" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(p)}>
                        <Trash2 className="mr-2 h-4 w-4" />Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!loading && pericias.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Página {page} de {lastPage}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
              <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !deletingBusy) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir perícia?</AlertDialogTitle><AlertDialogDescription>Esta ação é permanente. Perícias vinculadas a serviços ou em execução não podem ser excluídas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deletingBusy}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={deletingBusy} onClick={(event) => { event.preventDefault(); void deleteInspection(); }}> {deletingBusy ? "Excluindo..." : "Excluir perícia"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
