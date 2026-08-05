import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

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
          busca: debouncedQuery.trim() || undefined,
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
  }, [page, type, status, country, debouncedQuery]);

  return (
    <AppLayout title="Usuários" subtitle={`${total} resultado(s)`}>
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs
          value={type}
          onValueChange={(v) => {
            setType(v as TypeFilter);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="TECNICO">Técnicos</TabsTrigger>
            <TabsTrigger value="OFICINA">Oficinas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-35">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="desativado">Desativados</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={country}
            onValueChange={(v) => {
              setCountry(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-35">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos países</SelectItem>
              {COMMON_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-55">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar e-mail, CPF/CNPJ"
              className="pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{u.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{u.document ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.profile === "TECNICO" ? "secondary" : "outline"}>
                      {u.profile === "TECNICO" ? "Técnico" : "Oficina"}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.country ?? "—"}</TableCell>
                  <TableCell>
                    {u.status === "ativo" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-transparent">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Desativado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/usuarios/${u.id}`)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && users.length > 0 && (
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
