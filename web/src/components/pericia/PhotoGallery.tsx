import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoLightboxProps {
  src: string | null;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoLightbox({ src, alt = "Foto ampliada", open, onOpenChange }: PhotoLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
        {src && (
          <img
            src={src}
            alt={alt}
            className={cn("w-full max-h-[85vh] object-contain rounded-lg")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PhotoThumbnailProps {
  src?: string;
  label: string;
  onClick?: () => void;
}

export function PhotoThumbnail({ src, label, onClick }: PhotoThumbnailProps) {
  return (
    <button
      type="button"
      onClick={src ? onClick : undefined}
      disabled={!src}
      className={cn(
        "rounded-xl border border-border overflow-hidden text-left transition-opacity",
        src ? "cursor-pointer hover:opacity-90" : "cursor-default opacity-60",
      )}
    >
      <div className="aspect-4/3 bg-muted flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground px-2 text-center">Sem foto</span>
        )}
      </div>
      <p className="text-xs font-medium px-2 py-2 text-foreground">{label}</p>
    </button>
  );
}

interface PhotoGalleryProps {
  title: string;
  slots: readonly { key: string; label: string }[];
  photos?: Record<string, string>;
}

export function PhotoGallery({ title, slots, photos = {} }: PhotoGalleryProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function openPhoto(src: string) {
    setLightboxSrc(src);
    setLightboxOpen(true);
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <PhotoThumbnail
            key={slot.key}
            label={slot.label}
            src={photos[slot.key]}
            onClick={() => {
              const src = photos[slot.key];
              if (src) openPhoto(src);
            }}
          />
        ))}
      </div>

      <PhotoLightbox
        src={lightboxSrc}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </section>
  );
}
