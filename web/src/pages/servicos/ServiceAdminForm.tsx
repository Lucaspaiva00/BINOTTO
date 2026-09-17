import { CarFront, CircleDollarSign, UserRound, Wrench } from "lucide-react";
import { CarDiagram } from "@/components/pericia/CarDiagram";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VEHICLE_MODELS } from "@/constants/vehicleCatalog";
import { SERVICE_STATUS_LABEL } from "@/utils/serviceStatus";
import type { PartInspection } from "@/types/carParts";
import type { ServiceStatus } from "@/types/service";
import type { UserSelectionItem } from "@/types/user";

export type TechnicianCompensationType = "none" | "valor" | "porcentagem";

export interface ServiceAdminFormState {
  workshopId: string;
  status: ServiceStatus;
  technicianId: string;
  plate: string;
  chassis: string;
  model: string;
  price: string;
  compensationType: TechnicianCompensationType;
  compensationValue: string;
  notes: string;
}

interface Props {
  value: ServiceAdminFormState;
  onChange: <K extends keyof ServiceAdminFormState>(field: K, value: ServiceAdminFormState[K]) => void;
  workshops: UserSelectionItem[];
  technicians: UserSelectionItem[];
  partsState: Record<string, PartInspection>;
  errors?: Record<string, string>;
}

const STATUS_KEYS = Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[];

export function ServiceAdminForm({ value, onChange, workshops, technicians, partsState, errors = {} }: Props) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2"><Wrench className="h-5 w-5" /><h2 className="font-semibold">Serviço</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Oficina</Label>
            <SearchableSelect
              value={value.workshopId}
              onChange={(next) => onChange("workshopId", next)}
              placeholder="Digite ou selecione a oficina"
              options={workshops.map((workshop) => ({ value: String(workshop.id), label: workshop.name }))}
            />
            {errors.workshopId && <p className="text-xs text-destructive">{errors.workshopId}</p>}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={value.status} onValueChange={(next) => onChange("status", next as ServiceStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_KEYS.map((status) => <SelectItem key={status} value={status}>{SERVICE_STATUS_LABEL[status]}</SelectItem>)}</SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Técnico</Label>
            <Select value={value.technicianId || "none"} onValueChange={(next) => onChange("technicianId", next === "none" ? "" : next)}>
              <SelectTrigger><SelectValue placeholder="Sem técnico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem técnico</SelectItem>
                {technicians.map((technician) => <SelectItem key={technician.id} value={String(technician.id)}>{technician.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2"><CarFront className="h-5 w-5" /><h2 className="font-semibold">Informações do carro</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Placa</Label><Input value={value.plate} onChange={(e) => onChange("plate", e.target.value.toUpperCase())} placeholder="Placa" /></div>
          <div className="space-y-2"><Label>Chassi</Label><Input value={value.chassis} onChange={(e) => onChange("chassis", e.target.value.toUpperCase())} placeholder="Chassi" /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>Marca / modelo</Label>
            <Input list="vehicle-models" value={value.model} onChange={(e) => onChange("model", e.target.value)} placeholder="Ex.: Hyundai HB20" />
            <datalist id="vehicle-models">{VEHICLE_MODELS.map((model) => <option key={model} value={model} />)}</datalist>
          </div>
        </div>

        <div className="mt-5">
          <Label className="mb-2 block">Carro 3D</Label>
          <CarDiagram partsState={partsState} selectedPartId={null} onSelectPart={() => undefined} vehicleModel={value.model} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2"><CircleDollarSign className="h-5 w-5" /><h2 className="font-semibold">Preço e técnico</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Preço do serviço (€)</Label>
            <Input
              inputMode="decimal"
              value={value.price}
              onChange={(e) => onChange("price", e.target.value.replace(/[^0-9,.]/g, ""))}
              placeholder="0,00"
            />
            {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
          </div>
          <div className="space-y-2">
            <Label>Remuneração do técnico</Label>
            <Select value={value.compensationType} onValueChange={(next) => onChange("compensationType", next as TechnicianCompensationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Não informar</SelectItem><SelectItem value="valor">Valor fixo</SelectItem><SelectItem value="porcentagem">Porcentagem</SelectItem></SelectContent>
            </Select>
          </div>
          {value.compensationType !== "none" && (
            <div className="space-y-2 md:col-span-2">
              <Label>{value.compensationType === "porcentagem" ? "Porcentagem do técnico (%)" : "Valor do técnico (€)"}</Label>
              <Input
                inputMode="decimal"
                value={value.compensationValue}
                onChange={(e) => onChange("compensationValue", e.target.value.replace(/[^0-9,.]/g, ""))}
                placeholder={value.compensationType === "porcentagem" ? "0" : "0,00"}
              />
              {errors.compensationValue && <p className="text-xs text-destructive">{errors.compensationValue}</p>}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2"><UserRound className="h-5 w-5" /><h2 className="font-semibold">Observações</h2></div>
        <Textarea rows={4} value={value.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="Opcional" />
      </section>
    </div>
  );
}

export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (normalized === "") return 0;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
}

export function formatEditableDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(".", ",");
}
