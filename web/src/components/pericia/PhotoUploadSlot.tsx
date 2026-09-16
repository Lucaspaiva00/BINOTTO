import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoLightbox } from "@/components/pericia/PhotoGallery";
import { cn } from "@/lib/utils";

interface PhotoUploadSlotProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export function PhotoUploadSlot({ label, file, onChange }: PhotoUploadSlotProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="aspect-video bg-muted relative">
        {preview ? (
          <button type="button" className="w-full h-full" onClick={() => setLightboxOpen(true)}>
            <img src={preview} alt={label} className="w-full h-full object-contain" />
          </button>
        ) : (
          <label className={cn("flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/80 transition-colors")}>
            <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground px-2 text-center">Adicionar foto</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {file && (
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => onChange(null)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <PhotoLightbox src={preview} open={lightboxOpen} onOpenChange={setLightboxOpen} />
    </div>
  );
}

interface PhotoUploadGridProps {
  title: string;
  slots: readonly { key: string; label: string }[];
  photos: Record<string, File | null>;
  onChange: (key: string, file: File | null) => void;
}

export function PhotoUploadGrid({ title, slots, photos, onChange }: PhotoUploadGridProps) {
  const [index, setIndex] = useState(0);
  const current = slots[index] ?? slots[0];

  if (!current) return null;

  function previous() {
    setIndex((value) => (value - 1 + slots.length) % slots.length);
  }

  function next() {
    setIndex((value) => (value + 1) % slots.length);
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{index + 1} de {slots.length}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="icon" variant="outline" onClick={previous} disabled={slots.length < 2} aria-label="Foto anterior">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={next} disabled={slots.length < 2} aria-label="Próxima foto">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <PhotoUploadSlot
        label={current.label}
        file={photos[current.key] ?? null}
        onChange={(file) => onChange(current.key, file)}
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {slots.map((slot, itemIndex) => (
          <button
            key={slot.key}
            type="button"
            onClick={() => setIndex(itemIndex)}
            title={slot.label}
            className={cn(
              "h-2 rounded-full transition-all",
              itemIndex === index ? "w-6 bg-foreground" : photos[slot.key] ? "w-2 bg-emerald-500" : "w-2 bg-muted-foreground/35",
            )}
          />
        ))}
      </div>
    </section>
  );
}
