import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService } from "@/services/userService";
import { serviceService } from "@/services/serviceService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { UserSelectionItem } from "@/types/user";

const CURRENCIES = ["EUR", "BRL", "CHF", "GBP"] as const;

const FIELD_MAP: Record<string, string> = {
  oficina_id: "workshopId",
  moeda: "currency",
  data_inicio: "startDate",
  data_fim: "endDate",
  quantidade_tipo: "quantityType",
  quantidade: "quantity",
  observacoes: "notes",
};

export default function ServicoNew() {
  const navigate = useNavigate();

  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [workshopId, setWorkshopId] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantityType, setQuantityType] = useState<"none" | "carros" | "dias">("none");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedWorkshop = workshops.find((w) => String(w.id) === workshopId);
  const workshopMissingAddress = selectedWorkshop?.canRequestTechnician === false;

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const shops = await userService.listForSelection("OFICINA");
        if (cancelled) return;
        setWorkshops(shops);
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  function validate() {
    const next: Record<string, string> = {};
    if (!workshopId) next.workshopId = "Selecione a oficina.";
    if (workshopMissingAddress) {
      next.workshopId = "A oficina precisa ter endereço completo.";
    }
    if (startDate && endDate && endDate < startDate) {
      next.endDate = "Data final deve ser igual ou posterior à inicial.";
    }
    if (quantityType !== "none") {
      const parsed = Number(quantity);
      if (!Number.isInteger(parsed) || parsed < 1) {
        next.quantity = "Informe uma quantidade válida.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const created = await serviceService.create({
        oficina_id: Number(workshopId),
        moeda: currency,
        data_inicio: startDate || undefined,
        data_fim: endDate || undefined,
        quantidade_tipo: quantityType === "none" ? undefined : quantityType,
        quantidade: quantityType === "none" ? undefined : Number(quantity),
        observacoes: notes.trim() || undefined,
      });

      toast.success("Serviço criado.");
      navigate(`/servicos/${created.id}`);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      if (validationErrors) {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(validationErrors)) {
          mapped[FIELD_MAP[field] ?? field] = message;
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
    <AppLayout title="Novo serviço" subtitle="Cadastro administrativo">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/servicos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <section className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-2xl flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            O serviço entra como Em breve. A oficina completa fotos e perícia no aplicativo.
          </p>

          <div className="flex flex-col gap-2">
            <Label>Oficina</Label>
            <Select value={workshopId} onValueChange={setWorkshopId} disabled={loadingOptions}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar oficina" />
              </SelectTrigger>
              <SelectContent>
                {workshops.map((workshop) => (
                  <SelectItem key={workshop.id} value={String(workshop.id)}>
                    {workshop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}
            {workshopMissingAddress && !errors.workshopId && (
              <p className="text-xs text-destructive">Esta oficina não tem endereço completo.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Unidade</Label>
              <Select
                value={quantityType}
                onValueChange={(v) => setQuantityType(v as "none" | "carros" | "dias")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informar</SelectItem>
                  <SelectItem value="carros">Carros</SelectItem>
                  <SelectItem value="dias">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {quantityType !== "none" && (
            <div className="flex flex-col gap-2 max-w-40">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Data início</Label>
              <DateInput id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">Data fim</Label>
              <DateInput id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || loadingOptions || workshopMissingAddress}>
              {submitting ? "Salvando..." : "Criar serviço"}
            </Button>
          </div>
        </section>
      </form>
    </AppLayout>
  );
}
