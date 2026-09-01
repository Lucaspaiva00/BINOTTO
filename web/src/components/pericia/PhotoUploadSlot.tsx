import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
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
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="aspect-4/3 bg-muted relative">
        {preview ? (
          <button
            type="button"
            className="w-full h-full"
            onClick={() => setLightboxOpen(true)}
          >
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          </button>
        ) : (
          <label className={cn("flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/80 transition-colors")}>
            <ImagePlus className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground px-2 text-center">Adicionar foto</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {file && (
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(null)}>
            <Trash2 className="w-3.5 h-3.5" />
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
  return (
    <section className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <PhotoUploadSlot
            key={slot.key}
            label={slot.label}
            file={photos[slot.key] ?? null}
            onChange={(file) => onChange(slot.key, file)}
          />
        ))}
      </div>
    </section>
  );
}
