import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, Plus, Search, ScanSearch } from "lucide-react";
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
import {
  PERICIA_STATUS_CLASS,
  PERICIA_STATUS_LABEL,
  PERICIA_TIPO_LABEL,
} from "@/utils/periciaStatus";
import type { Pericia, PericiaStatus, PericiaTipo } from "@/types/pericia";

const PER_PAGE = 20;

type StatusFilter = "all" | PericiaStatus;
type TipoFilter = "all" | PericiaTipo;

function displayValue(pericia: Pericia): number | null {
  return pericia.tipo === "completa" ? pericia.inspectionValue : pericia.suggestedPrice;
}

export default function PericiasList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tipo, setTipo] = useState<TipoFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

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
          tipo: tipo === "all" ? undefined : tipo,
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

    return () => {
      cancelled = true;
    };
  }, [page, status, tipo, startDate, endDate, debouncedSearch]);

  return (
    <AppLayout title="Perícias" subtitle={`${total} perícia(s) encontrada(s)`}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/pericias/novo")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova perícia
        </Button>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-55">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por oficina ou placa"
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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.keys(PERICIA_STATUS_LABEL) as PericiaStatus[]).map((k) => (
              <SelectItem key={k} value={k}>
                {PERICIA_STATUS_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tipo}
          onValueChange={(v) => {
            setTipo(v as TipoFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="simples">{PERICIA_TIPO_LABEL.simples}</SelectItem>
            <SelectItem value="completa">{PERICIA_TIPO_LABEL.completa}</SelectItem>
          </SelectContent>
        </Select>

        <DateInput
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="w-40"
          aria-label="Data inicial"
        />

        <DateInput
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="w-40"
          aria-label="Data final"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-225">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Oficina</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead className="text-right sticky right-0 bg-card">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : pericias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  <ScanSearch className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  Nenhuma perícia encontrada.
                </TableCell>
              </TableRow>
            ) : (
              pericias.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell className="text-muted-foreground">{p.workshop ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.technician ?? "—"}</TableCell>
                  <TableCell>{p.licensePlate ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.model ?? "—"}</TableCell>
                  <TableCell>
                    {p.tipo ? PERICIA_TIPO_LABEL[p.tipo] : "—"}
                  </TableCell>
                  <TableCell>
                    {p.status ? (
                      <Badge variant="outline" className={PERICIA_STATUS_CLASS[p.status]}>
                        {PERICIA_STATUS_LABEL[p.status]}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(displayValue(p))}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                  <TableCell>
                    {p.serviceId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => navigate(`/servicos/${p.serviceId}`)}
                      >
                        #{p.serviceId}
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-card">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Ver perícia"
                      onClick={() => navigate(`/pericias/${p.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && pericias.length > 0 && (
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
