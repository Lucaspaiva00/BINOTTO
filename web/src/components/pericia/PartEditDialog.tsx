import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { getCarPartLabel } from "@/constants/carParts";
import { REPAIR_TYPE_LABEL, getRepairTypeColor } from "@/constants/repairTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoLightbox } from "@/components/pericia/PhotoGallery";
import type { PartInspection, PartPhoto, RepairType } from "@/types/carParts";
import { cn } from "@/lib/utils";

const REPAIR_TYPES: RepairType[] = [
  "SEM_DANO",
  "PDR",
  "PINTURA",
  "TROCA",
  "ALUMINIO_PDR",
  "ALUMINIO_PINTURA",
];

interface PartEditDialogProps {
  open: boolean;
  partId: string | null;
  value: PartInspection | null;
  completeInspection?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: PartInspection) => void;
}

function photoPreview(photo: PartPhoto): string {
  return photo instanceof File ? URL.createObjectURL(photo) : photo;
}

export function PartEditDialog({
  open,
  partId,
  value,
  completeInspection = false,
  onOpenChange,
  onSave,
}: PartEditDialogProps) {
  const [local, setLocal] = useState<PartInspection | null>(value);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLocal(value);
  }, [value, open]);

  if (!partId || !local) return null;

  function updateField<K extends keyof PartInspection>(key: K, next: PartInspection[K]) {
    setLocal((prev) => (prev ? { ...prev, [key]: next } : prev));
  }

  function addPhoto(file: File | undefined) {
    if (!file || !local || local.photos.length >= 2) return;
    updateField("photos", [...local.photos, file]);
  }

  function removePhoto(index: number) {
    if (!local) return;
    updateField(
      "photos",
      local.photos.filter((_, i) => i !== index),
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getCarPartLabel(partId)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Tipo de reparo</Label>
              <div className="flex flex-wrap gap-2">
                {REPAIR_TYPES.map((type) => {
                  const color = getRepairTypeColor(type);
                  const selected = local.repairType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField("repairType", type)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected ? "ring-2 ring-offset-1" : "opacity-80 hover:opacity-100",
                      )}
                      style={{
                        borderColor: color,
                        color,
                        backgroundColor: selected ? `${color}22` : "transparent",
                      }}
                    >
                      {REPAIR_TYPE_LABEL[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            {completeInspection && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="impacts-over">Impactos &gt; 25</Label>
                  <Input
                    id="impacts-over"
                    type="number"
                    min={0}
                    value={local.impactsOver25}
                    onChange={(e) => updateField("impactsOver25", Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="impacts-under">Impactos &lt; 25</Label>
                  <Input
                    id="impacts-under"
                    type="number"
                    min={0}
                    value={local.impactsUnder25}
                    onChange={(e) => updateField("impactsUnder25", Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={local.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Fotos ({local.photos.length}/2)</Label>
                {local.photos.length < 2 && (
                  <label className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                    <ImagePlus className="w-4 h-4" />
                    Adicionar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => addPhoto(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              {local.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {local.photos.map((photo, index) => {
                    const src = photoPreview(photo);
                    return (
                      <div key={`${index}-${src}`} className="relative rounded-lg overflow-hidden border border-border">
                        <button
                          type="button"
                          className="w-full aspect-4/3"
                          onClick={() => {
                            setLightboxSrc(src);
                            setLightboxOpen(true);
                          }}
                        >
                          <img src={src} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-7 w-7"
                          onClick={() => removePhoto(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma foto adicionada.</p>
              )}
            </div>

            <div>
              <Badge variant="outline" style={{ borderColor: getRepairTypeColor(local.repairType) }}>
                {REPAIR_TYPE_LABEL[local.repairType]}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => onSave(local)}>
              Salvar peça
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhotoLightbox src={lightboxSrc} open={lightboxOpen} onOpenChange={setLightboxOpen} />
    </>
  );
}
