import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, Plus, Search, ClipboardList } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serviceService } from "@/services/serviceService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { SERVICE_STATUS_CLASS, SERVICE_STATUS_LABEL } from "@/utils/serviceStatus";
import { COMMON_COUNTRIES } from "@/constants/countries";
import type { Service, ServiceStatus } from "@/types/service";

const PER_PAGE = 20;

type StatusFilter = "all" | ServiceStatus;

export default function ServicosList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<string>("all");
  const [services, setServices] = useState<Service[]>([]);
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

    async function loadServices() {
      setLoading(true);

      try {
        const response = await serviceService.list({
          page,
          per_page: PER_PAGE,
          status: status === "all" ? undefined : status,
          pais: country === "all" ? undefined : country,
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
  }, [page, status, country, debouncedSearch]);

  return (
    <AppLayout title="Serviços" subtitle={`${total} serviço(s) encontrado(s)`}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/servicos/novo")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo serviço
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
            {(Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[]).map((k) => (
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
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-205">
          <TableHeader>
            <TableRow>
              <TableHead>Criado por</TableHead>
              <TableHead>Oficina</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right sticky right-0 bg-card">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">
                    {s.createdBy ?? "—"}
                    <div className="text-xs text-muted-foreground">ID: {s.id}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.workshop ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.workshopCity ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.workshopCountry ?? "—"}</TableCell>
                  <TableCell>
                    {s.status ? (
                      <Badge variant="outline" className={SERVICE_STATUS_CLASS[s.status]}>
                        {SERVICE_STATUS_LABEL[s.status]}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-card">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Ver serviço"
                      onClick={() => navigate(`/servicos/${s.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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
