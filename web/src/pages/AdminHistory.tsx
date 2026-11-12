import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

type Movement = {
  id: number;
  origem: string;
  metodo: string | null;
  rota: string;
  referencia: string | null;
  usuario_id: number | null;
  descricao: string | null;
  created_at: string;
};
type HistoryPage = { data: Movement[]; last_page: number };

export function AdminHistory() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<HistoryPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const request = new AbortController();
    api.get<HistoryPage>("/configuracoes/historico", { params: { page }, signal: request.signal })
      .then(({ data }) => setResult(data))
      .catch(reason => { if (!request.signal.aborted) setError(getApiErrorMessage(reason)); });
    return () => request.abort();
  }, [page]);

  function changePage(next: number) {
    setResult(null);
    setError("");
    setPage(next);
  }

  return <div className="space-y-4">
    <h2 className="font-semibold">Movimentações do painel</h2>
    {error ? <p role="alert">{error}</p> : !result ? <p>Carregando…</p> : result.data.length === 0 ? <p>Nenhuma movimentação registrada.</p> : <>
      <ul className="divide-y rounded-md border">
        {result.data.map(entry => <li key={`${entry.origem}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
          <div>
            <p>{entry.descricao ?? `${entry.metodo} · ${entry.rota.replace("api/admin/", "")}`}</p>
            {entry.usuario_id != null && <p className="text-xs text-muted-foreground">Administrador #{entry.usuario_id}</p>}
          </div>
          {entry.referencia && (entry.rota.startsWith("api/admin/servicos")
            ? <Link className="underline" to={`/servicos/${entry.referencia}`}>Serviço #{entry.referencia}</Link>
            : <span>Registro #{entry.referencia}</span>)}
          <time className="text-muted-foreground" dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
        </li>)}
      </ul>
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</Button>
        <span>Página {page} de {result.last_page}</span>
        <Button variant="outline" disabled={page >= result.last_page} onClick={() => changePage(page + 1)}>Próxima</Button>
      </div>
    </>}
  </div>;
}
