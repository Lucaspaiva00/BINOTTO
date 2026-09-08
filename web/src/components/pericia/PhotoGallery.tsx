import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const carouselRef = useRef<HTMLDivElement>(null);

  function openPhoto(src: string) {
    setLightboxSrc(src);
    setLightboxOpen(true);
  }

  function scroll(direction: "previous" | "next") {
    carouselRef.current?.scrollBy({ left: direction === "next" ? 320 : -320, behavior: "smooth" });
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="outline" className="h-8 w-8" aria-label="Fotos anteriores" onClick={() => scroll("previous")}><ChevronLeft className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="outline" className="h-8 w-8" aria-label="Próximas fotos" onClick={() => scroll("next")}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
      <div ref={carouselRef} className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
        {slots.map((slot) => (
          <div key={slot.key} className="w-44 shrink-0 snap-start"><PhotoThumbnail
            label={slot.label}
            src={photos[slot.key]}
            onClick={() => {
              const src = photos[slot.key];
              if (src) openPhoto(src);
            }}
          /></div>
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
