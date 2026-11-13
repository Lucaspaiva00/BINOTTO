import { ColumnFilter } from "@/components/ui/column-filter";
import { PERICIA_COLUMNS, getTableColumns } from "@/constants/tablePreferences";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ScanSearch, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { periciaService } from "@/services/periciaService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { PERICIA_STATUS_CLASS, PERICIA_STATUS_LABEL } from "@/utils/periciaStatus";
import type { Pericia, PericiaStatus } from "@/types/pericia";

const PER_PAGE = 20;


function displayValue(pericia: Pericia): number | null {
  return pericia.inspectionValue ?? pericia.suggestedPrice ?? null;
}

export default function PericiasList() {
  const navigate = useNavigate();
  const [columns] = useState(() => getTableColumns("binotto-pericia-columns", PERICIA_COLUMNS));
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<Pericia | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [openActionsId, setOpenActionsId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPericias() {
      setLoading(true);
      try {
        const response = await periciaService.list({
          page,
          per_page: PER_PAGE,
          ...filters,
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
  }, [page, filters]);

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


  function filter(label: string, keys: string[], fields: ReactNode) {
    return <ColumnFilter label={label} active={keys.some(key => Boolean(filters[key]))} onApply={data => {
      const next = { ...filters };
      for (const key of keys) {
        const value = String(data?.get(key) ?? "").trim();
        if (value) next[key] = value;
        else delete next[key];
      }
      if (next.data_inicial && next.data_final && next.data_inicial > next.data_final) return "Intervalo inválido.";
      setFilters(next);
      setPage(1);
    }}>{fields}</ColumnFilter>;
  }

  const textFilter = (label: string, key: string) => filter(label, [key], <Input aria-label={label} name={key} defaultValue={filters[key]} />);
  const headers = {
    date: filter("Data", ["data_inicial", "data_final"], <>
      <DateInput name="data_inicial" aria-label="Data inicial" defaultValue={filters.data_inicial} />
      <DateInput name="data_final" aria-label="Data final" defaultValue={filters.data_final} />
    </>),
    workshop: textFilter("Oficina", "oficina"),
    plate: textFilter("Placa", "placa"),
    model: textFilter("Modelo", "modelo"),
    value: filter("Valor", ["valor_min", "valor_max"], <>
      <Input type="number" min="0" step="0.01" name="valor_min" aria-label="Valor mínimo" defaultValue={filters.valor_min} />
      <Input type="number" min="0" step="0.01" name="valor_max" aria-label="Valor máximo" defaultValue={filters.valor_max} />
    </>),
    status: filter("Status", ["status"], <select name="status" aria-label="Status" defaultValue={filters.status ?? ""} className="w-full rounded border bg-background p-2">
      <option value="">Todos os status</option>
      {(Object.keys(PERICIA_STATUS_LABEL) as PericiaStatus[]).map(status => <option key={status} value={status}>{PERICIA_STATUS_LABEL[status]}</option>)}
    </select>),
  };

  return (
    <AppLayout title="Perícias" subtitle={`${total} perícia(s) encontrada(s)`}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/pericias/novo")}><Plus className="w-4 h-4 mr-2" />Nova perícia</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              {columns.map(id => <TableHead key={id}>{headers[id]}</TableHead>)}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-10"><Spinner className="w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : pericias.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground"><ScanSearch className="w-8 h-8 mx-auto mb-2 opacity-60" />Nenhuma perícia encontrada.</TableCell></TableRow>
            ) : pericias.map((p) => (
              <TableRow key={p.id} onClick={() => navigate(`/pericias/${p.id}`)} className="cursor-pointer hover:bg-accent/50">
                {columns.map(id => <TableCell key={id} className="whitespace-nowrap">{{
                  date: formatDateTime(p.createdAt),
                  workshop: p.workshop || "—",
                  plate: p.licensePlate || "—",
                  model: p.model || "—",
                  value: formatCurrency(displayValue(p)),
                  status: p.status ? <Badge variant="outline" className={PERICIA_STATUS_CLASS[p.status]}>{PERICIA_STATUS_LABEL[p.status]}</Badge> : "—",
                }[id]}</TableCell>)}
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="relative inline-block text-left" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenActionsId(null); }}>
                    <Button size="icon" variant="ghost" aria-label="Ações da perícia" aria-expanded={openActionsId === p.id} onClick={() => setOpenActionsId((id) => id === p.id ? null : p.id)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {openActionsId === p.id && (
                      <div className="absolute right-0 top-full z-50 min-w-36 rounded-md border border-border bg-popover p-1 shadow-lg">
                        <button type="button" className="flex w-full items-center rounded-sm px-2 py-2 text-sm text-popover-foreground hover:bg-accent" onClick={() => { setOpenActionsId(null); navigate(`/pericias/${p.id}/editar`); }}>
                          <Pencil className="mr-2 h-4 w-4" />Editar
                        </button>
                        <button type="button" className="flex w-full items-center rounded-sm px-2 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setOpenActionsId(null); setDeleting(p); }}>
                          <Trash2 className="mr-2 h-4 w-4" />Deletar
                        </button>
                      </div>
                    )}
                  </div>
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
