import { useEffect, useState } from "react";
import { getCarPartLabel } from "@/constants/carParts";
import { API_BASE_URL } from "@/services/api/config";
import { REPAIR_TYPE_LABEL, getRepairTypeColor } from "@/constants/repairTypes";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PartInspection, RepairType, PartPhoto } from "@/types/carParts";

const TYPES: RepairType[] = ["PDR", "PINTURA", "TROCA", "ALUMINIO_PDR", "ALUMINIO_PINTURA", "SEM_DANO"];
function PhotoPreview({ photo, label }: { photo: PartPhoto; label: string }) {
  const [src, setSrc] = useState<string>(typeof photo === "string" ? photo : "");
  useEffect(() => {
    if (typeof photo === "string") {
      const host = API_BASE_URL.replace(/\/api\/admin\/?$/, "");
      setSrc(/^https?:\/\//.test(photo) ? photo : `${host}/${photo.replace(/^\/+/, "")}`);
      return;
    }
    const url = URL.createObjectURL(photo);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  return <img src={src} alt={label} className="aspect-4/3 w-full rounded border object-cover" />;
}
export function ServicePartDialog({ partId, value, onClose, onSave }: {
  partId: string | null; value: PartInspection | null; onClose: () => void; onSave: (value: PartInspection) => void;
}) {
  const [part, setPart] = useState<PartInspection | null>(value);
  useEffect(() => setPart(value ? { ...value, photos: [...value.photos] } : null), [partId, value]);
  if (!partId || !part) return null;
  const patch = (fields: Partial<PartInspection>) => setPart(prev => prev ? { ...prev, ...fields } : prev);
  const number = (raw: string) => Math.max(0, Math.min(9999, Number(raw.replace(/\D/g, "").slice(0, 4)) || 0));
  return <Dialog open={Boolean(partId)} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{getCarPartLabel(partId)}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1"><Label>Tipo de reparação</Label>
          <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={part.assessed === false ? "default" : "outline"} onClick={() => patch({ assessed: false, repairType: "SEM_DANO" })}>Não avaliada</Button>{TYPES.map(type => <Button key={type} type="button" size="sm" variant={part.assessed !== false && part.repairType === type ? "default" : "outline"} onClick={() => patch({ repairType: type, assessed: true })}>
            <span aria-hidden style={{ backgroundColor: getRepairTypeColor(type) }} className="mr-1 h-3 w-3 rounded-sm border border-black/10" />{REPAIR_TYPE_LABEL[type]}
          </Button>)}</div>
        </div>
        <div className="grid grid-cols-3 gap-2">{([
          ["dentsUpTo2", "Até 2 cm"], ["dentsUpTo5", "Até 5 cm"], ["dentsOver5", "Acima de 5 cm"],
        ] as const).map(([key, label]) => <div className="space-y-1" key={key}><Label>{label}</Label><Input type="number" inputMode="numeric" min={0} max={9999} value={part[key] ?? 0} onChange={e => patch({ [key]: number(e.target.value) })} /></div>)}</div>
        <div className="space-y-1"><Label>Observação</Label><Input maxLength={255} value={part.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Uma linha" /></div>
        <div className="space-y-2"><Label>Fotografias ({part.photos.length}/3)</Label>
          <div className="grid grid-cols-3 gap-2">{part.photos.map((photo, index) => <div key={index} className="space-y-1">
            <PhotoPreview photo={photo} label={`Foto ${index + 1}`} />
            <Button variant="outline" size="sm" type="button" className="w-full" onClick={() => patch({ photos: part.photos.filter((_, i) => i !== index) })}>Remover</Button>
          </div>)}</div>
          {part.photos.length < 3 && <Input aria-label="Adicionar foto da peça" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file && file.size <= 8 * 1024 * 1024) patch({ photos: [...part.photos, file] }); e.target.value = ""; }} />}
          <p className="text-xs text-muted-foreground">Máximo de três fotografias de até 8 MB.</p>
        </div>
      </div>
      <DialogFooter><Button variant="outline" type="button" onClick={onClose}>Cancelar</Button><Button type="button" onClick={() => onSave(part)}>Salvar peça</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
