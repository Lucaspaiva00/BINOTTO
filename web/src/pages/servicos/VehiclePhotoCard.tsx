import { useEffect, useRef, useState } from "react";
import { Download, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Content } from "@radix-ui/react-dialog";
import { API_BASE_URL } from "@/services/api/config";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function VehiclePhotoCard({ label, photo, onChange }: {
  label: string;
  photo: File | string | null;
  onChange: (photo: File | null) => void;
}) {
  const [preview, setPreview] = useState("");
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    if (typeof photo === "string") {
      const host = API_BASE_URL.replace(/\/api\/admin\/?$/, "");
      setPreview(new URL(photo, `${host || window.location.origin}/`).href);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function remove() {
    setOpen(false);
    onChange(null);
    requestAnimationFrame(() => uploadButton.current?.focus());
  }

  async function download() {
    setDownloading(true);
    try {
      const response = photo instanceof File ? null : await fetch(preview);
      if (response && !response.ok) throw new Error("Foto indisponível");
      const file = photo instanceof File ? photo : await response?.blob();
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = photo instanceof File ? photo.name : `${label}.${extension}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toast.error("Não foi possível baixar a foto.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="relative flex h-24 items-center justify-center bg-muted sm:h-28">
        {photo && preview ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button type="button" className="absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-inset" aria-label={`Ampliar foto de ${label}`}>
                <img src={preview} alt={label} className="h-full w-full object-cover" />
              </button>
            </DialogTrigger>
            <Button type="button" className="absolute right-2 top-2" variant="secondary" size="icon" aria-label={`Remover foto de ${label}`} onClick={remove}><Trash2 /></Button>
            <DialogPortal>
              <DialogOverlay />
              <Content aria-describedby={undefined} className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] gap-2 bg-black p-3 text-white sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle>{label}</DialogTitle>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="icon" aria-label="Remover foto" onClick={remove}><Trash2 /></Button>
                    <Button type="button" variant="secondary" size="icon" aria-label="Baixar foto" disabled={downloading} onClick={() => void download()}><Download /></Button>
                    <DialogClose asChild><Button type="button" variant="secondary" size="icon" aria-label="Fechar foto"><X /></Button></DialogClose>
                  </div>
                </div>
                <img src={preview} alt={label} className="h-full w-full object-contain" />
              </Content>
            </DialogPortal>
          </Dialog>
        ) : (
          <Button ref={uploadButton} type="button" variant="outline" size="sm" aria-label={`Carregar foto de ${label}`} onClick={() => fileInput.current?.click()}>
            Carregar
          </Button>
        )}
        <input ref={fileInput} hidden type="file" accept={PHOTO_TYPES.join(",")} onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!PHOTO_TYPES.includes(file.type) || file.size > 8 * 1024 * 1024) {
            toast.error("Escolha uma foto JPG, PNG ou WebP de até 8 MB.");
            return;
          }
          onChange(file);
        }} />
      </div>
      <p className="px-2 py-1.5 text-xs font-medium">{label}</p>
    </div>
  );
}
