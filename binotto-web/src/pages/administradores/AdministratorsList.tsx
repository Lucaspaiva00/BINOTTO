import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatDateTime } from "@/utils/date";
import type { Administrator } from "@/types/admin";

const PER_PAGE = 20;

export default function AdministratorsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAdministrators() {
      setLoading(true);

      try {
        const response = await adminService.list({ page, per_page: PER_PAGE });
        if (cancelled) return;

        setAdministrators(response.data);
        setLastPage(response.meta.last_page);
        setTotal(response.meta.total);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAdministrators();

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <AppLayout title="Administradores" subtitle={`${total} cadastrado(s)`}>
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/administradores/novo")}>
          <Plus className="w-4 h-4 mr-1" />
          Novo administrador
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : administrators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  Nenhum administrador cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              administrators.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-foreground">
                    {a.name} {user?.id === a.id && <span className="text-muted-foreground font-normal">(você)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={a.status === "ativo" ? "default" : "secondary"}
                      className={
                        a.status === "ativo"
                          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {a.status === "ativo" ? "Ativo" : "Desativado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/administradores/${a.id}/editar`)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && administrators.length > 0 && (
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
