import { Languages, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { periciaService } from "@/services/periciaService";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { AppLayout } from "@/components/layout/AppLayout";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const [coefficient, setCoefficient] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    periciaService.getSettings().then((data) => setCoefficient(Number(data.coeficiente_eur)))
      .catch(() => toast.error("Não foi possível carregar o coeficiente."))
      .finally(() => setLoading(false));
  }, []);
  async function saveCoefficient() {
    setSaving(true);
    try {
      const response = await periciaService.saveSettings(coefficient);
      setCoefficient(Number(response.coeficiente_eur));
      toast.success("Coeficiente atualizado para novas perícias convencionais.");
    } catch { toast.error("Não foi possível salvar o coeficiente."); }
    finally { setSaving(false); }
  }
  return (
    <AppLayout title="Configurações" subtitle="Preferências do painel administrativo">
      <section className="max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent"><Languages className="h-5 w-5" /></div>
          <div><h2 className="font-semibold">Idioma do sistema</h2><p className="text-sm text-muted-foreground">A preferência fica salva neste navegador.</p></div>
        </div>
        <div className="space-y-2">
          <Label>Idioma</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as AppLanguage)}>
            <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="fr">Francês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
      <section className="mt-5 max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3"><Calculator className="h-5 w-5" /><div><h2 className="font-semibold">Coeficiente da perícia convencional</h2><p className="text-sm text-muted-foreground">Regra inicial: quantidade de amassados × coeficiente em euros. Não altera perícias já cadastradas.</p></div></div>
        <div className="max-w-xs space-y-2"><Label>Coeficiente (€ por amassado)</Label><CurrencyInput value={coefficient} onChange={setCoefficient} disabled={loading || saving} /></div>
        {coefficient === 0 && <p className="text-sm text-amber-600">Defina um coeficiente maior que zero para habilitar novas perícias convencionais.</p>}
        <Button onClick={saveCoefficient} disabled={loading || saving || coefficient <= 0}>{saving ? "Salvando..." : "Salvar coeficiente"}</Button>
      </section>
    </AppLayout>
  );
}
