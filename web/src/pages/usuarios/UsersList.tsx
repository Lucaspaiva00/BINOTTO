import { ColumnFilter } from "@/components/ui/column-filter";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wrench, UserRound, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { COMMON_COUNTRIES } from "@/constants/countries";
import type { AppUser, UserType, UserStatus } from "@/types/user";

type TypeFilter = "all" | UserType;
type StatusFilter = "all" | UserStatus;

const PER_PAGE = 20;

export default function UsersList() {
  const navigate = useNavigate();
  const [type, setType] = useState<TypeFilter>("TECNICO");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      try {
        const response = await userService.list({
          page,
          per_page: PER_PAGE,
          perfil: type === "all" ? undefined : type,
          status: status === "all" ? undefined : status,
          pais: country === "all" ? undefined : country,
          cidade: city.trim() || undefined,
          busca: query.trim() || undefined,
        });
        if (cancelled) return;
        setUsers(response.data);
        setLastPage(response.meta.last_page);
        setTotal(response.meta.total);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [page, type, status, country, city, query]);

  function filter(label: string, value: string, update: (value: string) => void, options?: [string, string][]) {
    return <ColumnFilter label={label} active={Boolean(value && value !== "all")} onApply={data => {
      update(String(data?.get("filter") ?? (options ? "all" : "")).trim());
      setPage(1);
    }}>{options ? <select name="filter" aria-label={label} defaultValue={value} className="w-full rounded border bg-background p-2">
      <option value="all">Todos</option>
      {options.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
    </select> : <Input name="filter" aria-label={label} defaultValue={value} />}</ColumnFilter>;
  }

  return (
    <AppLayout title="Usuários" subtitle={`${total} resultado(s)`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Tabs
          value={type}
          onValueChange={(v) => {
            setType(v as TypeFilter);
            setPage(1);
          }}
        >
          <TabsList className="h-9 text-sm">
            <TabsTrigger value="TECNICO">Técnico</TabsTrigger>
            <TabsTrigger value="OFICINA">Cliente</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => navigate("/usuarios/novo")}><Plus className="w-4 h-4 mr-1" />Novo usuário</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl mt-4 overflow-x-auto">
        <Table className="min-w-235">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>ID</TableHead>
              <TableHead>{filter("Nome / ID / documento", query, setQuery)}</TableHead>
              <TableHead>{type === "TECNICO" ? "Apelido" : type === "OFICINA" ? "Responsável" : "Responsável / Apelido"}</TableHead>
              <TableHead>{filter("Cidade", city, setCity)}</TableHead>
              <TableHead>{filter("País", country, setCountry, COMMON_COUNTRIES.map(c => [c, c]))}</TableHead>
              <TableHead>{filter("Status", status, value => setStatus(value as StatusFilter), [["ativo", "Ativos"], ["desativado", "Suspensos"]])}</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10"><Spinner className="w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} onClick={() => navigate(`/usuarios/${u.id}`)} className="cursor-pointer hover:bg-accent/50">
                  <TableCell>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
                      {u.profile === "OFICINA" ? <Wrench className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">#{u.id}</TableCell>
                  <TableCell><div className="font-medium text-foreground">{u.name ?? "—"}</div></TableCell>
                  <TableCell>{u.profile === "TECNICO" ? (u.nickname ?? "—") : (u.responsible ?? "—")}</TableCell>
                  <TableCell>{u.city ?? "—"}</TableCell>
                  <TableCell>{u.country ?? "—"}</TableCell>
                  <TableCell>
                    {u.status === "ativo" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-transparent">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Suspenso</Badge>
                    )}
                  </TableCell>
                  <TableCell><span className="text-sm font-medium">{u.profileCompletionPercent != null ? `${u.profileCompletionPercent}%` : "—"}</span></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Página {page} de {lastPage}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
              <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
