import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CarDiagram } from "@/components/pericia/CarDiagram";
import { PartEditDialog } from "@/components/pericia/PartEditDialog";
import { PhotoUploadGrid } from "@/components/pericia/PhotoUploadSlot";
import { RepairSummary } from "@/components/pericia/RepairSummary";
import {
  COMPLETE_PHOTO_SLOTS,
  TECH_PHOTO_SLOTS,
  getCarPartLabel,
} from "@/constants/carParts";
import { REPAIR_TYPE_COLOR, REPAIR_TYPE_LABEL } from "@/constants/repairTypes";
import { userService } from "@/services/userService";
import { periciaService } from "@/services/periciaService";
import { buildPericiaFormData, createInitialPartsState } from "@/utils/buildPericiaFormData";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { PartInspection, RepairType } from "@/types/carParts";
import type { UserSelectionItem } from "@/types/user";

const TECH_PHOTO_KEYS = TECH_PHOTO_SLOTS.map((slot) => slot.key);
const COMPLETE_PHOTO_KEYS = COMPLETE_PHOTO_SLOTS.map((slot) => slot.key);

const FIELD_MAP: Record<string, string> = {
  oficina_id: "workshopId",
  tecnico_id: "technicianId",
  placa: "licensePlate",
  chassi: "chassis",
  marca_modelo: "model",
  tipo: "tipo",
  preco_sugerido: "value",
  valor_pericia: "value",
};

function createPhotoState(keys: string[]) {
  return keys.reduce(
    (acc, key) => {
      acc[key] = null;
      return acc;
    },
    {} as Record<string, File | null>,
  );
}

export default function PericiaNew() {
  const navigate = useNavigate();

  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [technicians, setTechnicians] = useState<UserSelectionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [workshopId, setWorkshopId] = useState("");
  const [technicianId, setTechnicianId] = useState("none");
  const [licensePlate, setLicensePlate] = useState("");
  const [chassis, setChassis] = useState("");
  const [model, setModel] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [includeValue, setIncludeValue] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [inspectionValue, setInspectionValue] = useState(0);

  const [photos, setPhotos] = useState<Record<string, File | null>>(() => createPhotoState(TECH_PHOTO_KEYS));
  const [completePhotos, setCompletePhotos] = useState<Record<string, File | null>>(() =>
    createPhotoState(COMPLETE_PHOTO_KEYS),
  );
  const [partsState, setPartsState] = useState<Record<string, PartInspection>>(() => createInitialPartsState());

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [pendingTipoChange, setPendingTipoChange] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [shops, techs] = await Promise.all([
          userService.listForSelection("OFICINA"),
          userService.listForSelection("TECNICO"),
        ]);
        if (cancelled) return;
        setWorkshops(shops);
        setTechnicians(techs);
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

  const changedParts = useMemo(
    () =>
      Object.entries(partsState)
        .filter(([, part]) => part.repairType !== "SEM_DANO")
        .map(([partId, part]) => ({
          id: partId,
          label: getCarPartLabel(partId),
          repairType: part.repairType,
        })),
    [partsState],
  );

  function handleTipoChange(next: boolean) {
    if (next === isComplete) return;
    setPendingTipoChange(next);
  }

  function confirmTipoChange() {
    if (pendingTipoChange == null) return;
    setIsComplete(pendingTipoChange);
    setPartsState(createInitialPartsState());
    setPendingTipoChange(null);
  }

  function toggleApplyToAllParts(type: RepairType) {
    setPartsState((prev) => {
      const allSelected = Object.values(prev).every((part) => part.repairType === type);
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = {
          ...next[id],
          repairType: allSelected ? "SEM_DANO" : type,
        };
      });
      return next;
    });
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!workshopId) next.workshopId = "Selecione a oficina.";
    if (!licensePlate.trim()) next.licensePlate = "Informe a placa.";
    if (!chassis.trim()) next.chassis = "Informe o chassi.";
    if (!model.trim()) next.model = "Informe a marca/modelo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const formData = buildPericiaFormData({
        workshopId: Number(workshopId),
        technicianId: technicianId === "none" ? null : Number(technicianId),
        licensePlate,
        chassis,
        model,
        tipo: isComplete ? "completa" : "simples",
        includeValue,
        suggestedPrice: includeValue ? suggestedPrice : null,
        inspectionValue: includeValue ? inspectionValue : null,
        photos,
        completePhotos,
        partsState,
      });

      const created = await periciaService.create(formData);
      toast.success("Perícia criada.");
      navigate(`/pericias/${created.id}`);
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
    <AppLayout title="Nova perícia" subtitle="Cadastro administrativo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/pericias")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <section className="bg-card border border-border rounded-2xl p-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label>Técnico (opcional)</Label>
            <Select value={technicianId} onValueChange={setTechnicianId} disabled={loadingOptions}>
              <SelectTrigger>
                <SelectValue placeholder="Sem técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem técnico</SelectItem>
                {technicians.map((technician) => (
                  <SelectItem key={technician.id} value={String(technician.id)}>
                    {technician.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <PhotoUploadGrid
          title="Fotos técnicas"
          slots={TECH_PHOTO_SLOTS}
          photos={photos}
          onChange={(key, file) => setPhotos((prev) => ({ ...prev, [key]: file }))}
        />

        <section className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Perícia básica</p>
              <p className="text-xs text-muted-foreground">Alternar para completa reseta as peças.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Básica</span>
              <Switch checked={isComplete} onCheckedChange={handleTipoChange} />
              <span className="text-xs text-muted-foreground">Completa</span>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              placeholder="ABC1D23"
            />
            {errors.licensePlate && <p className="text-xs text-destructive">{errors.licensePlate}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="chassis">Chassi</Label>
            <Input
              id="chassis"
              value={chassis}
              onChange={(e) => setChassis(e.target.value.toUpperCase())}
              placeholder="VT004251"
            />
            {errors.chassis && <p className="text-xs text-destructive">{errors.chassis}</p>}
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="model">Marca / modelo</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Volkswagen Gol"
            />
            {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
          </div>
        </section>

        {isComplete && (
          <PhotoUploadGrid
            title="Fotos da perícia completa"
            slots={COMPLETE_PHOTO_SLOTS}
            photos={completePhotos}
            onChange={(key, file) => setCompletePhotos((prev) => ({ ...prev, [key]: file }))}
          />
        )}

        <section className="bg-card border border-border rounded-2xl p-4 space-y-4">
          {!isComplete && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => toggleApplyToAllParts("PDR")}>
                Tudo PDR
              </Button>
              <Button type="button" variant="outline" onClick={() => toggleApplyToAllParts("PINTURA")}>
                Tudo Pintura
              </Button>
            </div>
          )}

          <CarDiagram
            partsState={partsState}
            selectedPartId={selectedPartId}
            onSelectPart={(partId) => {
              setSelectedPartId(partId);
              setPartDialogOpen(true);
            }}
            canEdit
          />

          <div className="flex flex-wrap gap-3">
            {(Object.keys(REPAIR_TYPE_LABEL) as RepairType[]).map((type) => (
              <div key={type} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: REPAIR_TYPE_COLOR[type] }}
                  aria-hidden
                />
                {REPAIR_TYPE_LABEL[type]}
              </div>
            ))}
          </div>
        </section>

        {changedParts.length > 0 && (
          <section className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">Resumo das alterações</h3>
            <div className="space-y-2">
              {changedParts.map((part) => (
                <div key={part.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: REPAIR_TYPE_COLOR[part.repairType] }}
                  />
                  <span className="font-medium">{part.label}</span>
                  <span className="text-muted-foreground">— {REPAIR_TYPE_LABEL[part.repairType]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <RepairSummary partsState={partsState} />

        <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isComplete ? "Valor da perícia" : "Preço sugerido"}</Label>
            <Switch checked={includeValue} onCheckedChange={setIncludeValue} />
          </div>
          {includeValue ? (
            <CurrencyInput
              value={isComplete ? inspectionValue : suggestedPrice}
              onChange={isComplete ? setInspectionValue : setSuggestedPrice}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {isComplete ? "Valor oculto." : "Sem preço sugerido."}
            </p>
          )}
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || loadingOptions}>
            {submitting ? "Salvando..." : "Salvar perícia"}
          </Button>
        </div>
      </form>

      <PartEditDialog
        open={partDialogOpen}
        partId={selectedPartId}
        value={selectedPartId ? partsState[selectedPartId] : null}
        completeInspection={isComplete}
        onOpenChange={setPartDialogOpen}
        onSave={(value) => {
          if (!selectedPartId) return;
          setPartsState((prev) => ({ ...prev, [selectedPartId]: value }));
          setPartDialogOpen(false);
        }}
      />

      <AlertDialog open={pendingTipoChange != null} onOpenChange={(open) => !open && setPendingTipoChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar tipo da perícia?</AlertDialogTitle>
            <AlertDialogDescription>
              Trocar entre básica e completa vai resetar todas as peças do diagrama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTipoChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
