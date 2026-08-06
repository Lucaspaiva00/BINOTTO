import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { OficinaDocument } from "@/types/user";

type Props = {
  userId: number;
};

export default function OficinaDocumentsTab({ userId }: Props) {
  const [documents, setDocuments] = useState<OficinaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    setLoading(true);
    try {
      const data = await userService.listDocuments(userId);
      setDocuments(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);
    try {
      await userService.uploadDocument(userId, file);
      toast.success("Documento enviado");
      await loadDocuments();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(documentId: number) {
    try {
      await userService.deleteDocument(userId, documentId);
      toast.success("Documento removido");
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">CNPJ</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Envie o comprovante de CNPJ da oficina (PDF ou imagem).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Enviando..." : "Enviar CNPJ"}
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">Nenhum documento enviado.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <a
                    href={doc.arquivo_url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sm truncate block hover:underline"
                  >
                    {doc.nome}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {doc.tamanho_formatado ?? ""}
                    {doc.created_at
                      ? ` · ${new Date(doc.created_at).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(doc.id)}
                aria-label="Remover documento"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
