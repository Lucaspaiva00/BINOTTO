import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { AppUser, UpdateUserPayload } from "@/types/user";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
};

export default function UserCompanyTab({ user, onUserUpdated }: Props) {
  const [tradeName, setTradeName] = useState(user.tradeName ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [companyDocument, setCompanyDocument] = useState(user.companyDocument ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { markDirty, markSaved } = useUnsavedChanges();

  useEffect(() => {
    setTradeName(user.tradeName ?? "");
    setCompanyName(user.companyName ?? "");
    setCompanyDocument(user.companyDocument ?? "");
    markSaved();
  }, [user, markSaved]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload: UpdateUserPayload = user.profile === "OFICINA"
      ? {
          nome_fantasia: tradeName.trim() || null,
          razao_social: companyName.trim() || null,
          documento: companyDocument.trim() || null,
        }
      : {
          nome_fantasia_empresa: tradeName.trim() || null,
          razao_social_empresa: companyName.trim() || null,
          cnpj_empresa: companyDocument.trim() || null,
        };

    try {
      const updated = await userService.update(user.id, payload);
      onUserUpdated(updated);
      markSaved();
      toast.success("Dados da empresa atualizados.");
    } catch (error) {
      const validation = getApiValidationErrors(error);
      if (validation) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validation)) {
          if (field === "nome_fantasia" || field === "nome_fantasia_empresa") mapped.tradeName = message;
          else if (field === "razao_social" || field === "razao_social_empresa") mapped.companyName = message;
          else if (field === "documento" || field === "cnpj_empresa") mapped.companyDocument = message;
          else mapped[field] = message;
        }
        setErrors(mapped);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Empresa</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Nome, razão social e CNPJ vinculados a este usuário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
          {errors.tradeName && <p className="text-xs text-destructive">{errors.tradeName}</p>}
        </div>
        <div className="space-y-2">
          <Label>Razão social</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>CNPJ</Label>
          <Input
            value={companyDocument}
            onChange={(e) => setCompanyDocument(e.target.value)}
            placeholder="00.000.000/0000-00"
          />
          {errors.companyDocument && <p className="text-xs text-destructive">{errors.companyDocument}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar empresa"}
        </Button>
      </div>
    </form>
  );
}
