import { useEffect, useState } from "react";
import { Camera, CarFront, CircleDollarSign, ClipboardList, Loader2, Paintbrush, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { CarDiagram } from "@/components/pericia/CarDiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  defaultPrices, emptyVehiclePhotos, PRICE_KEYS, SERVICE_PARTS_ORDER, VEHICLE_PHOTOS, resolveDetailedPrices,
  type DetailedPrices, type DetailedPriceKey, type VehiclePhotoKey, type VehiclePhotoMap,
} from "./serviceDetails";

export type TechnicianCompensationType = "none" | "valor" | "porcentagem";
export interface ServiceAdminFormState {
  workshopId: string;
  status: ServiceStatus;
  technicianId: string;
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
  errors?: Record<string, string>;
}
const STATUS_KEYS = Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[];
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
  onAccept, onRefuse, canAccept = false, canRefuse = false, actionBusy = false, errors = {},
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
    for (const id of SERVICE_PARTS_ORDER) {
      const current = partsState[id];
      onPartChange(id, { ...current, repairType: type });
    }
  }
  function updatePrice(key: DetailedPriceKey, update: Partial<DetailedPrices[DetailedPriceKey]>) {
    onChange("detailedPrices", { ...value.detailedPrices, [key]: { ...value.detailedPrices[key], ...update } });
  }
  const totals = resolveDetailedPrices(value.detailedPrices);
  const formatted = (amount: number | undefined) => amount == null ? "—" : new Intl.NumberFormat("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(amount);
  return <div className="space-y-5">
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5" />Solicitante</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Oficina</Label><SearchableSelect value={value.workshopId} onChange={v => onChange("workshopId", v)} placeholder="Selecione a oficina" options={workshops.map(w => ({ value: String(w.id), label: w.name }))}/>{errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}</div>
        <div className="space-y-2"><Label>Status</Label><Select value={value.status} onValueChange={v => onChange("status", v as ServiceStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_KEYS.map(status => <SelectItem key={status} value={status}>{SERVICE_STATUS_LABEL[status]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Técnico</Label><Select value={value.technicianId || "none"} onValueChange={v => onChange("technicianId", v === "none" ? "" : v)}><SelectTrigger><SelectValue placeholder="Sem técnico" /></SelectTrigger><SelectContent><SelectItem value="none">Sem técnico</SelectItem>{technicians.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select></div>
        {(onAccept || onRefuse) && <div className="flex items-end gap-2"><Button type="button" disabled={actionBusy || !canAccept || !value.technicianId} onClick={onAccept}><ThumbsUp className="mr-1 h-4 w-4"/>Aceitar</Button><Button type="button" variant="outline" disabled={actionBusy || !canRefuse} onClick={onRefuse}><ThumbsDown className="mr-1 h-4 w-4"/>Recusar</Button></div>}
      </div>
      {(onAccept || onRefuse) && <p className="text-xs text-muted-foreground">Aceitar confirma administrativamente o técnico selecionado; recusar libera a vaga. Não representa uma ação realizada pelo técnico no celular.</p>}
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><CarFront className="h-5 w-5"/>Carro</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {cameraField("placa", "plate", "Placa")}{cameraField("chassi", "chassis", "Chassi")}
        {cameraField("marca", "brand", "Marca")}{cameraField("modelo", "vehicleModel", "Modelo")}
      </div>
      <p className="text-xs text-muted-foreground">A câmera anexa a imagem. O preenchimento por IA depende da configuração do servidor e deve ser conferido manualmente.</p>
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
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!onPartChange} onClick={() => bulk("PDR")}>Tudo PDR</Button><Button type="button" variant="outline" disabled={!onPartChange} onClick={() => bulk("PINTURA")}><Paintbrush className="mr-1 h-4 w-4"/>Tudo Pintura</Button></div>
      <CarDiagram partsState={partsState} selectedPartId={selectedPiece} onSelectPart={id => { setSelectedPiece(id); onPartSelect?.(id); }} canEdit={Boolean(onPartSelect)} vehicleModel={`${value.brand} ${value.vehicleModel}`} />
      <div className="flex flex-wrap items-center gap-3 text-xs">{(["PDR", "PINTURA", "TROCA", "ALUMINIO_PDR", "ALUMINIO_PINTURA", "SEM_DANO"] as RepairType[]).map(type => <span className="inline-flex items-center gap-1" key={type}><span className="inline-block h-3 w-3 rounded-sm border" style={type.startsWith("ALUMINIO") ? { background: "repeating-linear-gradient(45deg,#2687f9,#2687f9 3px,#27bb70 3px,#27bb70 4px)" } : { backgroundColor: getRepairTypeColor(type) }} />{REPAIR_TYPE_LABEL[type]}</span>)}</div>
      <details open={detailsOpen} onToggle={e => setDetailsOpen(e.currentTarget.open)} className="rounded-xl border p-3">
        <summary className="cursor-pointer font-medium">Detalhes do serviço (clique para {detailsOpen ? "recolher" : "expandir"})</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-185 text-sm"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Tipo</th><th className="p-2">Peça</th><th className="p-2">Até 2 cm</th><th className="p-2">Até 5 cm</th><th className="p-2">Acima de 5 cm</th><th className="p-2">Observação</th><th className="p-2">Fotos</th></tr></thead><tbody>
          {SERVICE_PARTS_ORDER.map(id => {
            const part = partsState[id];
            function update(changes: Partial<PartInspection>) { onPartChange?.(id, { ...part, ...changes }); }
            function count(value: string): number { return Math.min(9999, Number(value.replace(/\D/g, "").slice(0, 4)) || 0); }
            return <tr key={id} className="border-t"><td className="p-1"><select aria-label={`Tipo ${getCarPartLabel(id)}`} className="h-9 max-w-35 rounded border bg-background p-1" value={part.repairType} disabled={!onPartChange} onChange={e => update({ repairType: e.target.value as RepairType })}>{TYPE_KEYS.map(type => <option key={type} value={type}>{REPAIR_TYPE_LABEL[type]}</option>)}</select></td>
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
      <p className="text-xs text-muted-foreground">Carro e desmontagem são calculados separadamente. Oficina fixa + percentual do técnico calcula o técnico; técnico fixo + percentual da oficina calcula a oficina. Os resultados são informativos e não geram faturamento automático.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {PRICE_KEYS.map(({ key, label }) => {
          const price = value.detailedPrices[key];
          const ownProfile = key.startsWith("oficina_") ? "oficina" : "técnico";
          const oppositeProfile = ownProfile === "oficina" ? "técnico" : "oficina";
          return <div key={key} className="space-y-3 rounded-xl border p-3">
            <Label className="font-semibold">{label}</Label>
            <Select value={price.tipo} onValueChange={type => updatePrice(key, { tipo: type as "valor" | "porcentagem" })}>
              <SelectTrigger aria-label={`Tipo de ${label}`}><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="valor">Valor fixo</SelectItem><SelectItem value="porcentagem">Porcentagem</SelectItem></SelectContent>
            </Select>
            <Input aria-label={`Valor de ${label}`} inputMode="decimal" value={price.valor} onChange={e => updatePrice(key, { valor: e.target.value.replace(/[^0-9,.]/g, "") })} placeholder={price.tipo === "valor" ? "0,00" : "0%"} />
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs" htmlFor={`ocultar-${key}`}>Ocultar preço no APP da {oppositeProfile}</Label>
              <Switch id={`ocultar-${key}`} checked={!price.visivel_app} onCheckedChange={checked => updatePrice(key, { visivel_app: !checked })} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs" htmlFor={`preencher-${key}`}>Visualizar e preencher no APP da {ownProfile}</Label>
              <Switch id={`preencher-${key}`} checked={price.habilitado_preenchimento_app} onCheckedChange={checked => updatePrice(key, { habilitado_preenchimento_app: checked })} />
            </div>
          </div>;
        })}
      </div>
      {totals ? <div className="rounded-lg bg-muted px-4 py-3 text-sm" aria-live="polite">
        <p className="font-semibold mb-2">Valores calculados (moeda do serviço)</p>
        <p>Carro — oficina: {formatted(totals.carro.oficina)} · técnico: {formatted(totals.carro.tecnico)}</p>
        <p>Desmontagem — oficina: {formatted(totals.desmontagem.oficina)} · técnico: {formatted(totals.desmontagem.tecnico)}</p>
      </div> : <p role="alert" className="text-sm text-destructive">Cada item precisa de pelo menos um valor fixo. O percentual da oficina usado no cálculo inverso deve ser maior que zero.</p>}
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
