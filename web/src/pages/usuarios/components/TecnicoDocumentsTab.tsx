import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { OficinaDocument } from "@/types/user";

const SECTIONS = [
  { tipo: "identidade", title: "Identidade", limit: 2 },
  { tipo: "passaporte", title: "Passaporte", limit: 2 },
  { tipo: "doc_empresa", title: "CNPJ", limit: 5 },
  { tipo: "doc_ext", title: "Documentos extras", limit: 5 },
] as const;

type Props = {
  userId: number;
};

export default function TecnicoDocumentsTab({ userId }: Props) {
  const [documents, setDocuments] = useState<OficinaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  async function handleUpload(tipo: string, file: File | undefined) {
    if (!file) return;

    setUploadingTipo(tipo);
    try {
      await userService.uploadDocument(userId, file, tipo);
      toast.success("Documento enviado");
      await loadDocuments();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingTipo(null);
      const input = inputRefs.current[tipo];
      if (input) input.value = "";
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
    <div className="space-y-8">
      {SECTIONS.map((section) => {
        const docs = documents.filter((doc) => doc.tipo === section.tipo);
        const atLimit = docs.length >= section.limit;
        const uploading = uploadingTipo === section.tipo;

        return (
          <div key={section.tipo} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {docs.length}/{section.limit} · PDF ou imagem
                </p>
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[section.tipo] = el;
                }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleUpload(section.tipo, e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading || atLimit}
                onClick={() => inputRefs.current[section.tipo]?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Enviando..." : atLimit ? "Limite atingido" : "Enviar"}
              </Button>
            </div>

            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum documento enviado.</p>
            ) : (
              <ul className="space-y-3">
                {docs.map((doc) => (
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
      })}
    </div>
  );
}
