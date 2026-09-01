import { getCarPartLabel } from "@/constants/carParts";
import { REPAIR_TYPE_LABEL, getRepairTypeColor } from "@/constants/repairTypes";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PartInspection, PartPhoto, RepairType } from "@/types/carParts";
import { PhotoLightbox } from "@/components/pericia/PhotoGallery";
import { useState } from "react";

interface PartDetailDialogProps {
  open: boolean;
  partId: string | null;
  value: PartInspection | null;
  onOpenChange: (open: boolean) => void;
}

function photoSrc(photo: PartPhoto): string {
  return photo instanceof File ? URL.createObjectURL(photo) : photo;
}

export function PartDetailDialog({ open, partId, value, onOpenChange }: PartDetailDialogProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!partId || !value) return null;

  const repairType = value.repairType as RepairType;
  const color = getRepairTypeColor(repairType);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getCarPartLabel(partId)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo de reparo</p>
              <Badge
                variant="outline"
                style={{ borderColor: color, color, backgroundColor: `${color}22` }}
              >
                {REPAIR_TYPE_LABEL[repairType] ?? repairType}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Amassados</p>
                <p className="font-medium">{value.dentCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impactos &gt; 25</p>
                <p className="font-medium">{value.impactsOver25}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impactos &lt; 25</p>
                <p className="font-medium">{value.impactsUnder25}</p>
              </div>
            </div>

            {value.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{value.notes}</p>
              </div>
            )}

            {value.photos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Fotos ({value.photos.length}/2)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {value.photos.map((photo, index) => {
                    const src = photoSrc(photo);
                    return (
                    <button
                      key={`${index}-${src}`}
                      type="button"
                      onClick={() => {
                        setLightboxSrc(src);
                        setLightboxOpen(true);
                      }}
                      className="rounded-lg overflow-hidden border border-border aspect-4/3"
                    >
                      <img src={src} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PhotoLightbox src={lightboxSrc} open={lightboxOpen} onOpenChange={setLightboxOpen} />
    </>
  );
}
