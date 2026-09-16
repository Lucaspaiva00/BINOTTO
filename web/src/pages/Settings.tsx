import { Languages } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { language, setLanguage } = useLanguage();
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
    </AppLayout>
  );
}
