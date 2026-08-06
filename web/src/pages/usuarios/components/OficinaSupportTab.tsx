import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { SupportTicket } from "@/types/user";

type Props = {
  userId: number;
};

export default function OficinaSupportTab({ userId }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await userService.listSupportTickets(userId);
      setTickets(data);
      if (selectedId && !data.some((ticket) => ticket.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [userId]);

  async function handleCreate() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha assunto e mensagem");
      return;
    }

    setSaving(true);
    try {
      const ticket = await userService.createSupportTicket(userId, {
        assunto: subject.trim(),
        mensagem: message.trim(),
      });
      toast.success("Chamado aberto");
      setSubject("");
      setMessage("");
      setTickets((prev) => [ticket, ...prev]);
      setSelectedId(ticket.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleReply() {
    if (!selected || !reply.trim()) return;

    setSaving(true);
    try {
      const created = await userService.replySupportTicket(userId, selected.id, reply.trim());
      toast.success("Resposta enviada");
      setReply("");
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selected.id
            ? {
                ...ticket,
                status: "aberto",
                messages: [...(ticket.messages ?? []), created],
              }
            : ticket,
        ),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (!selected) return;

    setSaving(true);
    try {
      const closed = await userService.closeSupportTicket(userId, selected.id);
      toast.success("Chamado fechado");
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === closed.id ? { ...ticket, ...closed } : ticket)),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Abrir chamado</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Cada mensagem é registrada e enviada por e-mail com cópia.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Assunto</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
        </div>
        <Button
          type="button"
          disabled={saving}
          onClick={handleCreate}
          className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent-light))] text-black font-semibold"
        >
          {saving ? "Enviando..." : "Abrir chamado"}
        </Button>

        <div className="pt-4 border-t border-border space-y-2">
          <h4 className="text-sm font-medium">Histórico</h4>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum chamado.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full text-left border rounded-xl px-3 py-2 transition-colors ${
                      selectedId === ticket.id
                        ? "border-[hsl(var(--app-accent))] bg-accent/40"
                        : "border-border hover:bg-accent/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{ticket.subject}</span>
                      <Badge variant={ticket.status === "aberto" ? "default" : "secondary"}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(ticket.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border border-border rounded-2xl p-4 min-h-80">
        {!selected ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Selecione um chamado para ver a conversa.
          </p>
        ) : (
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{selected.subject}</h3>
                <p className="text-xs text-muted-foreground">#{selected.id}</p>
              </div>
              {selected.status === "aberto" && (
                <Button type="button" size="sm" variant="outline" disabled={saving} onClick={handleClose}>
                  Fechar
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-3 max-h-80 overflow-y-auto">
              {(selected.messages ?? []).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    item.authorType === "admin" ? "bg-accent/50" : "bg-muted"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.authorType === "admin" ? "Admin" : "Usuário"} ·{" "}
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <p className="whitespace-pre-wrap">{item.body}</p>
                </div>
              ))}
            </div>

            {selected.status === "aberto" && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label>Responder</Label>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
                <Button type="button" disabled={saving || !reply.trim()} onClick={handleReply}>
                  Enviar resposta
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
