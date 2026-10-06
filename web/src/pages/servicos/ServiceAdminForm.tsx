import { useEffect, useState } from "react";
import { Camera, CarFront, CircleDollarSign, ClipboardList, Loader2, Paintbrush, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { CarDiagram } from "@/components/pericia/CarDiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getCarPartLabel } from "@/constants/carParts";
import { REPAIR_TYPE_LABEL, getRepairTypeColor } from "@/constants/repairTypes";
import { periciaService, type VehiclePhotoField } from "@/services/periciaService";
import { API_BASE_URL } from "@/services/api/config";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { SERVICE_STATUS_LABEL } from "@/utils/serviceStatus";
import type { PartInspection, RepairType } from "@/types/carParts";
import type { ServiceStatus } from "@/types/service";
import type { UserSelectionItem } from "@/types/user";
import {
  localTodayISO, defaultPrices, emptyVehiclePhotos, SERVICE_PARTS_ORDER, VEHICLE_PHOTOS, resolveDetailedPrices,
  type DetailedPrices, type DetailedPriceKey, type SuggestionPriceKey, type VehiclePhotoKey, type VehiclePhotoMap,
} from "./serviceDetails";

export type TechnicianCompensationType = "none" | "valor" | "porcentagem";
export interface ServiceAdminFormState {
  workshopId: string;
  status: ServiceStatus;
  technicianId: string;
  registeredTechnician: boolean;
  manualTechnicianName: string;
  serviceDate: string;
  plate: string;
  chassis: string;
  model: string; // legado: marca+modelo para evitar quebrar consumidores antigos
  brand: string;
  vehicleModel: string;
  vehiclePhotos: VehiclePhotoMap;
  inspectionType: "simples" | "completa";
  detailedPrices: DetailedPrices;
  price: string;
  compensationType: TechnicianCompensationType;
  compensationValue: string;
  notes: string;
}
export function initialServiceForm(): ServiceAdminFormState {
  return {
    serviceDate: localTodayISO(), registeredTechnician: false, manualTechnicianName: "",
    workshopId: "", status: "aguardando", technicianId: "", plate: "", chassis: "", model: "",
    brand: "", vehicleModel: "", vehiclePhotos: emptyVehiclePhotos(), inspectionType: "simples",
    detailedPrices: defaultPrices(), price: "0", compensationType: "none", compensationValue: "0", notes: "",
  };
}
interface Props {
  value: ServiceAdminFormState;
  onChange: <K extends keyof ServiceAdminFormState>(field: K, value: ServiceAdminFormState[K]) => void;
  workshops: UserSelectionItem[];
  technicians: UserSelectionItem[];
  partsState: Record<string, PartInspection>;
  onPartSelect?: (id: string) => void;
  onPartChange?: (id: string, next: PartInspection) => void;
  onAccept?: () => void;
  onRefuse?: () => void;
  canAccept?: boolean;
  canRefuse?: boolean;
  actionBusy?: boolean;
  statusLocked?: boolean;
  errors?: Record<string, string>;
}
const STATUS_KEYS = (Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[]).filter(status => !["finalizado", "retrabalho", "aceito", "concluido"].includes(status));
const TYPE_KEYS: RepairType[] = ["PDR", "PINTURA", "TROCA", "ALUMINIO_PDR", "ALUMINIO_PINTURA", "SEM_DANO"];
function resolvePhoto(photo: string): string {
  if (/^https?:\/\//.test(photo)) return photo;
  const host = API_BASE_URL.replace(/\/api\/admin\/?$/, "");
  return `${host}/${photo.replace(/^\/+/, "")}`;
}
function VehiclePhotoCard({ label, photo, onChange }: {
  label: string; photo: File | string | null; onChange: (photo: File | string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!photo) { setUrl(null); return; }
    if (typeof photo === "string") { setUrl(resolvePhoto(photo)); return; }
    const src = URL.createObjectURL(photo);
    setUrl(src);
    return () => URL.revokeObjectURL(src);
  }, [photo]);
  return <div className="overflow-hidden rounded-lg border border-border">
    <div className="relative aspect-4/3 bg-muted">{url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Camera className="h-6 w-6 text-muted-foreground" /></div>}</div>
    <div className="space-y-1 p-2"><p className="text-xs font-medium">{label}</p>
      <label className="block cursor-pointer rounded border px-2 py-1 text-center text-xs hover:bg-accent">
        {url ? "Substituir" : "Fotografar"}
        <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => {
          const file = e.target.files?.[0];
          if (file) { if (file.size > 8 * 1024 * 1024) toast.error("Foto maior que 8 MB."); else onChange(file); }
          e.target.value = "";
        }} />
      </label>
      {url && <Button className="w-full h-7" type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>Remover</Button>}
    </div>
  </div>;
}

export function ServiceAdminForm({ value, onChange, workshops, technicians, partsState, onPartSelect, onPartChange,
  onAccept, onRefuse, canAccept = false, canRefuse = false, actionBusy = false, statusLocked = false, errors = {},
}: Props) {
  const [recognizing, setRecognizing] = useState<VehiclePhotoField | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  function photoChange(key: VehiclePhotoKey, photo: File | string | null) {
    onChange("vehiclePhotos", { ...value.vehiclePhotos, [key]: photo });
  }
  async function recognize(field: VehiclePhotoField, file: File) {
    photoChange(field, file);
    setRecognizing(field);
    try {
      const result = await periciaService.recognizePhoto(field, file);
      if (result) onChange(({ placa: "plate", chassi: "chassis", marca: "brand", modelo: "vehicleModel" } as const)[field], result);
      else toast.info("Foto anexada. Preencha ou confira o campo manualmente.");
    } catch (e) {
      toast.warning(getApiErrorMessage(e));
    } finally { setRecognizing(null); }
  }
  function cameraField(field: VehiclePhotoField, key: "plate" | "chassis" | "brand" | "vehicleModel", label: string) {
    return <div className="space-y-2" key={key}><Label>{label}</Label><div className="flex gap-2">
      <Input value={value[key]} onChange={e => onChange(key, ["plate", "chassis"].includes(key) ? e.target.value.toUpperCase() : e.target.value)} placeholder={label} />
      <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border hover:bg-accent" aria-label={`Fotografar ${label}`}>
        {recognizing === field ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={Boolean(recognizing)} onChange={e => {
          const file = e.target.files?.[0];
          if (file) { if (file.size > 8 * 1024 * 1024) toast.error("Foto maior que 8 MB."); else void recognize(field, file); }
          e.target.value = "";
        }}/>
      </label>
    </div></div>;
  }
  function bulk(type: RepairType) {
    if (!onPartChange) return;
    const deselect = SERVICE_PARTS_ORDER.every(id => partsState[id]?.assessed !== false && partsState[id]?.repairType === type);
    for (const id of SERVICE_PARTS_ORDER) {
      const current = partsState[id];
      onPartChange(id, { ...current, repairType: deselect ? "SEM_DANO" : type, assessed: !deselect });
    }
  }
  function updatePrice(key: DetailedPriceKey | SuggestionPriceKey, update: Partial<DetailedPrices[DetailedPriceKey | SuggestionPriceKey]>) {
    onChange("detailedPrices", { ...value.detailedPrices, [key]: { ...value.detailedPrices[key], ...update } });
  }
  const totals = resolveDetailedPrices(value.detailedPrices);
  const formatted = (amount: number | undefined) => amount == null ? "—" : new Intl.NumberFormat("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(amount);
  return <div className="space-y-5">
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5" />Solicitante</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Oficina</Label><SearchableSelect value={value.workshopId} onChange={v => onChange("workshopId", v)} placeholder="Selecione a oficina" options={workshops.map(w => ({ value: String(w.id), label: w.name }))}/>{errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}</div>
        <div className="space-y-2"><Label htmlFor="service-date">Data</Label><DateInput id="service-date" required value={value.serviceDate} onChange={e => onChange("serviceDate", e.target.value)} />{errors.serviceDate && <p className="text-xs text-destructive">{errors.serviceDate}</p>}</div>
        <div className="space-y-2"><Label>Técnico</Label><SearchableSelect value={value.technicianId} onChange={v => onChange("technicianId", v)} placeholder="Selecione um técnico" options={technicians.map(t => ({ value: String(t.id), label: t.name }))} /></div>
        <div className="space-y-2"><Label>Status</Label><Select disabled={statusLocked} value={value.status} onValueChange={v => onChange("status", v as ServiceStatus)}><SelectTrigger><SelectValue>{SERVICE_STATUS_LABEL[value.status]}</SelectValue></SelectTrigger><SelectContent>{STATUS_KEYS.map(status => <SelectItem key={status} value={status}>{SERVICE_STATUS_LABEL[status]}</SelectItem>)}</SelectContent></Select></div>
        {(onAccept || onRefuse) && <div className="flex items-end gap-2">
          <Button type="button" className={`bg-green-600 text-white hover:bg-green-700 ${value.status === "aceito" ? "disabled:opacity-100" : ""}`} disabled={actionBusy || !canAccept || !value.technicianId} onClick={onAccept}><ThumbsUp className="mr-1 h-4 w-4"/>{value.status === "aceito" ? "Aceito" : "Aceitar"}</Button>
          <Button type="button" className="bg-red-600 text-white hover:bg-red-700" disabled={actionBusy || !canRefuse || !value.technicianId || value.status === "aceito"} onClick={onRefuse}><ThumbsDown className="mr-1 h-4 w-4"/>Recusar</Button>
        </div>}
      </div>

    </section>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><CarFront className="h-5 w-5"/>Carro</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cameraField("placa", "plate", "Placa")}{cameraField("chassi", "chassis", "Chassi")}
        {cameraField("marca", "brand", "Marca")}{cameraField("modelo", "vehicleModel", "Modelo")}
      </div>

      <h3 className="font-medium">Fotos do veículo</h3><div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {VEHICLE_PHOTOS.slice(0, 4).map(({ key, label }) => <VehiclePhotoCard key={key} label={label} photo={value.vehiclePhotos[key]} onChange={photo => photoChange(key, photo)}/>) }
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold">Serviço</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de perícia">
        <Button type="button" variant={value.inspectionType === "simples" ? "default" : "outline"} onClick={() => onChange("inspectionType", "simples")}>Perícia básica</Button>
        <Button type="button" variant={value.inspectionType === "completa" ? "default" : "outline"} onClick={() => onChange("inspectionType", "completa")}>Perícia detalhada</Button>
      </div>
      <p className="text-xs text-muted-foreground">Por enquanto, essa escolha identifica o serviço sem modificar automaticamente os cálculos.</p>
      <div className="flex flex-wrap gap-2"><Button type="button" aria-pressed={SERVICE_PARTS_ORDER.every(id => partsState[id]?.assessed !== false && partsState[id]?.repairType === "PDR")} variant={SERVICE_PARTS_ORDER.every(id => partsState[id]?.assessed !== false && partsState[id]?.repairType === "PDR") ? "default" : "outline"} disabled={!onPartChange} onClick={() => bulk("PDR")}>Tudo PDR</Button><Button type="button" aria-pressed={SERVICE_PARTS_ORDER.every(id => partsState[id]?.assessed !== false && partsState[id]?.repairType === "PINTURA")} variant={SERVICE_PARTS_ORDER.every(id => partsState[id]?.assessed !== false && partsState[id]?.repairType === "PINTURA") ? "default" : "outline"} disabled={!onPartChange} onClick={() => bulk("PINTURA")}><Paintbrush className="mr-1 h-4 w-4"/>Tudo Pintura</Button></div>
      <CarDiagram partsState={partsState} selectedPartId={selectedPiece} onSelectPart={id => { setSelectedPiece(id); onPartSelect?.(id); }} canEdit={Boolean(onPartSelect)} vehicleModel={`${value.brand} ${value.vehicleModel}`} />
      <div className="flex flex-wrap items-center gap-3 text-xs"><span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border bg-white" />Não avaliada</span>{(["PDR", "PINTURA", "TROCA", "ALUMINIO_PDR", "ALUMINIO_PINTURA", "SEM_DANO"] as RepairType[]).map(type => <span className="inline-flex items-center gap-1" key={type}><span className="inline-block h-3 w-3 rounded-sm border" style={type.startsWith("ALUMINIO") ? { background: "repeating-linear-gradient(45deg,#2687f9,#2687f9 3px,#27bb70 3px,#27bb70 4px)" } : { backgroundColor: getRepairTypeColor(type) }} />{REPAIR_TYPE_LABEL[type]}</span>)}</div>
      <details open={detailsOpen} onToggle={e => setDetailsOpen(e.currentTarget.open)} className="rounded-xl border p-3">
        <summary className="cursor-pointer font-medium">Detalhes do serviço (clique para {detailsOpen ? "recolher" : "expandir"})</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-185 text-sm"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Tipo</th><th className="p-2">Peça</th><th className="p-2">Até 2 cm</th><th className="p-2">Até 5 cm</th><th className="p-2">Acima de 5 cm</th><th className="p-2">Observação</th><th className="p-2">Fotos</th></tr></thead><tbody>
          {SERVICE_PARTS_ORDER.map(id => {
            const part = partsState[id];
            function update(changes: Partial<PartInspection>) { onPartChange?.(id, { ...part, ...changes }); }
            function count(value: string): number { return Math.min(9999, Number(value.replace(/\D/g, "").slice(0, 4)) || 0); }
            return <tr key={id} className="border-t"><td className="p-1"><select aria-label={`Tipo ${getCarPartLabel(id)}`} className="h-9 max-w-35 rounded border bg-background p-1" value={part.assessed === false ? "unassessed" : part.repairType} disabled={!onPartChange} onChange={e => update({ repairType: e.target.value === "unassessed" ? "SEM_DANO" : e.target.value as RepairType, assessed: e.target.value !== "unassessed" })}><option value="unassessed">Não avaliada</option>{TYPE_KEYS.map(type => <option key={type} value={type}>{REPAIR_TYPE_LABEL[type]}</option>)}</select></td>
              <td className="whitespace-nowrap p-1">{getCarPartLabel(id)}</td>
              {(["dentsUpTo2", "dentsUpTo5", "dentsOver5"] as const).map(key => <td className="p-1" key={key}><Input aria-label={`${getCarPartLabel(id)} ${key}`} type="number" min={0} max={9999} className="min-w-19" value={part[key] ?? 0} disabled={!onPartChange} onChange={e => update({ [key]: count(e.target.value) })}/></td>)}
              <td className="p-1"><Input maxLength={255} className="min-w-30" aria-label={`Observação ${getCarPartLabel(id)}`} value={part.notes} disabled={!onPartChange} onChange={e => update({ notes: e.target.value })}/></td>
              <td className="p-1"><Button type="button" variant="outline" size="sm" disabled={!onPartSelect} onClick={() => onPartSelect?.(id)}>{part.photos.length}/3</Button></td>
            </tr>;
          })}
        </tbody></table></div>
      </details>
    </section>


    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><CircleDollarSign className="h-5 w-5"/>Preço</h2>

      <div className="overflow-x-auto">
        <div className="min-w-[980px] space-y-2">
          <div className="grid grid-cols-[9rem_minmax(9rem,1fr)_5.5rem_minmax(19rem,1.8fr)_minmax(10rem,1fr)_5.5rem] items-center gap-3 border-b pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span aria-hidden="true" />
            <span>Fatura</span>
            <span className="text-center">Visível</span>
            <span>Técnico</span>
            <span>Sugestão Técnico</span>
            <span className="text-center">Visível</span>
          </div>

          {(["carro", "desmontagem"] as const).map(item => {
            const officeKey = `oficina_${item}` as DetailedPriceKey;
            const techKey = `tecnico_${item}` as DetailedPriceKey;
            const suggestionKey = `tecnico_sugestao_${item}` as SuggestionPriceKey;
            const office = value.detailedPrices[officeKey];
            const tech = value.detailedPrices[techKey];
            const suggestion = value.detailedPrices[suggestionKey];
            const calculated = totals?.[item];
            const heading = item === "carro" ? "REPARAÇÃO" : "DESMONTAGEM";

            return <div key={item} className="grid grid-cols-[9rem_minmax(9rem,1fr)_5.5rem_minmax(19rem,1.8fr)_minmax(10rem,1fr)_5.5rem] items-center gap-3 rounded-lg border px-3 py-3">
              <span className="font-semibold">{heading}</span>

              <Input
                inputMode="decimal"
                aria-label={`Fatura — ${heading}`}
                value={office.valor}
                onChange={e => updatePrice(officeKey, { tipo: "valor", valor: e.target.value.replace(/[^0-9,.]/g, "") })}
                placeholder="0,00"
              />

              <div className="flex justify-center">
                <Switch
                  aria-label={`Fatura visível — ${heading}`}
                  checked={office.visivel_app}
                  onCheckedChange={checked => updatePrice(officeKey, { visivel_app: checked })}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex shrink-0 rounded-md border p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3"
                    variant={tech.tipo === "porcentagem" ? "default" : "ghost"}
                    onClick={() => updatePrice(techKey, { tipo: "porcentagem" })}
                  >%</Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3"
                    variant={tech.tipo === "valor" ? "default" : "ghost"}
                    onClick={() => updatePrice(techKey, { tipo: "valor" })}
                  >$</Button>
                </div>

                <Input
                  className="min-w-24"
                  inputMode="decimal"
                  aria-label={`Técnico — ${heading}`}
                  value={tech.valor}
                  onChange={e => updatePrice(techKey, { valor: e.target.value.replace(/[^0-9,.]/g, "") })}
                  placeholder={tech.tipo === "porcentagem" ? "0%" : "0,00"}
                />

                {tech.tipo === "porcentagem" && <Input
                  className="min-w-28"
                  readOnly
                  aria-label={`Valor do técnico — ${heading}`}
                  value={formatted(calculated?.tecnico)}
                  title="Valor do técnico em dinheiro"
                />}
              </div>

              <Input
                inputMode="decimal"
                aria-label={`Sugestão técnico — ${heading}`}
                value={suggestion.valor}
                onChange={e => updatePrice(suggestionKey, { tipo: "valor", valor: e.target.value.replace(/[^0-9,.]/g, "") })}
                placeholder="0,00"
              />

              <div className="flex justify-center">
                <Switch
                  aria-label={`Sugestão técnico visível — ${heading}`}
                  checked={suggestion.habilitado_preenchimento_app}
                  onCheckedChange={checked => updatePrice(suggestionKey, { habilitado_preenchimento_app: checked })}
                />
              </div>
            </div>;
          })}

          <div className="grid grid-cols-[9rem_1fr_1fr_1fr] items-center gap-3 rounded-lg border bg-muted/40 px-3 py-3">
            <span className="font-semibold">TOTAL</span>
            <div className="flex items-center gap-2">
              <Label className="w-24 shrink-0 text-xs">Oficina / Fatura</Label>
              <Input readOnly aria-label="Total oficina" value={totals ? formatted(totals.carro.oficina + totals.desmontagem.oficina) : "—"} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-xs">Técnico</Label>
              <Input readOnly aria-label="Total técnico" value={totals ? formatted(totals.carro.tecnico + totals.desmontagem.tecnico) : "—"} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-xs">Empresa</Label>
              <Input readOnly aria-label="Total empresa" value={totals ? formatted(totals.carro.oficina + totals.desmontagem.oficina - totals.carro.tecnico - totals.desmontagem.tecnico) : "—"} />
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="rounded-2xl border border-border bg-card p-5"><Label>Observação geral</Label><Input className="mt-2" maxLength={255} value={value.notes} onChange={e => onChange("notes", e.target.value)} placeholder="Uma linha" /></section>
  </div>;
}
export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (normalized === "") return 0;
  const n = Number(normalized); return Number.isFinite(n) ? n : Number.NaN;
}
export function formatEditableDecimal(value: number | null | undefined): string {
  return value == null ? "" : String(value).replace(".", ",");
}
