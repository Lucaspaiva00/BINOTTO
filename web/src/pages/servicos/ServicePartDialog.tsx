import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, FileImage, X } from "lucide-react";
import { API_BASE_URL } from "@/services/api/config";
import { REPAIR_TYPE_LABEL, getRepairTypeColor } from "@/constants/repairTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PartInspection, PartPhoto, ServicePartSpecification } from "@/types/carParts";
import { SERVICE_DENT_FIELDS, servicePartLabel } from "./serviceDetails";

const TYPES = ["PDR", "PINTURA", "SEM_DANO", "TROCA"] as const;
const PHOTO_TYPES = "image/jpeg,image/png,image/webp";
const PRICE_FIELDS = [
  ["percentual", "Percentual (%)", 100, "0.01"],
  ["ut", "UT", 99, "1"],
  ["total", "Total da peça", 99999999, "0.01"],
] as const;

function PhotoPreview({ photo, label }: { photo: PartPhoto; label: string }) {
  const [src, setSrc] = useState("");
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
  return <img src={src} alt={label} className="h-16 w-full rounded border object-cover" />;
}

export function ServicePartDialog({ partId, value, onClose, onSave }: {
  partId: string;
  value: PartInspection | null;
  onClose: () => void;
  onSave: (value: PartInspection) => void;
}) {
  const [part, setPart] = useState(value);
  const [error, setError] = useState("");
  const camera = useRef<HTMLInputElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [openingCamera, setOpeningCamera] = useState(false);
  useEffect(() => {
    mounted.current = true;
    close.current?.focus({ preventScroll: true });
    return () => {
      mounted.current = false;
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
  }, [stream]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setStream(null);
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      camera.current?.click();
      return;
    }
    setOpeningCamera(true);
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (!mounted.current) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = media;
      setStream(media);
    } catch {
      if (mounted.current) setError("Não foi possível abrir a câmera. Confira a permissão ou escolha uma foto nos arquivos.");
    } finally {
      if (mounted.current) setOpeningCamera(false);
    }
  }

  function capturePhoto() {
    const preview = video.current;
    if (!preview?.videoWidth) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1920 / Math.max(preview.videoWidth, preview.videoHeight));
    canvas.width = Math.round(preview.videoWidth * scale);
    canvas.height = Math.round(preview.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(preview, 0, 0, canvas.width, canvas.height);
    const capturedStream = streamRef.current;
    canvas.toBlob(blob => {
      if (!blob || !mounted.current || !capturedStream || streamRef.current !== capturedStream) return;
      appendPhoto(new File([blob], `peca-${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.9);
  }

  if (!part) return null;
  const spec = part.specification ?? {};
  const aluminum = spec.aluminio ?? part.repairType.startsWith("ALUMINIO_");
  const repairType = part.repairType === "ALUMINIO_PDR" ? "PDR"
    : part.repairType === "ALUMINIO_PINTURA" ? "PINTURA" : part.repairType;
  const patch = (fields: Partial<PartInspection>) => setPart(prev => prev ? { ...prev, ...fields } : prev);
  const patchSpec = (fields: Partial<ServicePartSpecification>) =>
    setPart(prev => prev ? { ...prev, specification: { ...prev.specification, ...fields } } : prev);

  function chooseType(type: typeof repairType, useAluminum: boolean) {
    return useAluminum && type === "PDR" ? "ALUMINIO_PDR"
      : useAluminum && type === "PINTURA" ? "ALUMINIO_PINTURA" : type;
  }

  function addPhoto(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0];
    event.target.value = "";
    if (photo) appendPhoto(photo);
  }

  function appendPhoto(photo: File) {
    if (!part) return;
    if (part.photos.length >= 3 || photo.size > 8 * 1024 * 1024 || !PHOTO_TYPES.split(",").includes(photo.type)) {
      setError("Anexe até três fotos em JPG, PNG ou WebP, com até 8 MB cada.");
      return;
    }
    setError("");
    setPart(current => current && current.photos.length < 3 ? { ...current, photos: [...current.photos, photo] } : current);
  }

  function save() {
    if (!part) return;
    for (const [key, label] of SERVICE_DENT_FIELDS) {
      const count = spec[key];
      if (count != null && (!Number.isInteger(count) || count < 0 || count > 9999)) {
        setError(`Informe uma quantidade inteira de 0 a 9999 em ${label}.`);
        return;
      }
    }
    for (const [key, label, max, step] of PRICE_FIELDS) {
      const amount = spec[key];
      if (amount != null && (!Number.isFinite(amount) || amount < 0 || amount > max || (step === "1" && !Number.isInteger(amount)))) {
        setError(`Revise o valor de ${label}.`);
        return;
      }
    }
    onSave(part);
  }

  return (
    <div role="region" aria-labelledby="service-part-title" className="space-y-3"
      onKeyDown={event => {
        if (event.key === "Escape") onClose();
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
      }}>
      <div className="flex items-center justify-between gap-2">
        <h3 id="service-part-title" className="font-semibold">{servicePartLabel(partId)}</h3>
        <Button ref={close} type="button" variant="ghost" size="sm" onClick={onClose}><X className="size-4" />Fechar</Button>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={spec.cola ?? false} onChange={event => patchSpec({ cola: event.target.checked })} />Cola</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={aluminum} onChange={event => {
          const checked = event.target.checked;
          patch({ repairType: chooseType(repairType, checked), specification: { ...spec, aluminio: checked } });
        }} />Alumínio</label>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de reparação">
        {TYPES.map(type => (
          <Button key={type} type="button" size="sm" variant={part.assessed !== false && repairType === type ? "default" : "outline"}
            aria-pressed={part.assessed !== false && repairType === type}
            onClick={() => patch({ repairType: chooseType(type, aluminum), assessed: true })}>
            <span aria-hidden style={{ backgroundColor: getRepairTypeColor(type) }} className="size-2.5 rounded-sm" />{REPAIR_TYPE_LABEL[type]}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SERVICE_DENT_FIELDS.map(([key, label]) => (
          <div className="space-y-1" key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} type="number" inputMode="numeric" min={0} max={9999} value={spec[key] ?? ""} placeholder="—"
              onChange={event => patchSpec({ [key]: event.target.value === "" ? null : Number(event.target.value) })} />
          </div>
        ))}
      </div>
      {Boolean(part.dentsUpTo2 || part.dentsUpTo5 || part.dentsOver5) && (
        <p className="text-xs text-muted-foreground">Registro anterior: até 2 cm ({part.dentsUpTo2 ?? 0}), até 5 cm ({part.dentsUpTo5 ?? 0}), acima de 5 cm ({part.dentsOver5 ?? 0}).</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {PRICE_FIELDS.map(([key, label, max, step]) => (
          <div className="space-y-1" key={key}>
            <Label htmlFor={`part-${key}`}>{label}</Label>
            {key === "total" && repairType === "TROCA"
              ? <Input id="part-total" value="NOVO" readOnly />
              : <Input id={`part-${key}`} type="number" inputMode={step === "1" ? "numeric" : "decimal"} min={0} max={max} step={step}
                value={spec[key] ?? ""} placeholder="—"
                onChange={event => patchSpec({ [key]: event.target.value === "" ? null : Number(event.target.value) })} />}
          </div>
        ))}
      </div>
      <div className="space-y-1"><Label htmlFor="part-note">Observações</Label><Input id="part-note" maxLength={255} value={part.notes} onChange={event => patch({ notes: event.target.value })} /></div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Fotos</span>
        <Button type="button" variant="outline" size="icon" aria-label="Abrir câmera" title="Abrir câmera" disabled={part.photos.length >= 3 || openingCamera || Boolean(stream)} onClick={() => void openCamera()}><Camera /></Button>
        <Button type="button" variant="outline" size="icon" aria-label="Buscar foto nos arquivos" title="Buscar foto nos arquivos" disabled={part.photos.length >= 3} onClick={() => files.current?.click()}><FileImage /></Button>
        <input ref={camera} hidden type="file" accept={PHOTO_TYPES} capture="environment" onChange={addPhoto} />
        <input ref={files} hidden type="file" accept={PHOTO_TYPES} onChange={addPhoto} />
      </div>
      {stream && <div className="space-y-2 rounded border p-2">
        <video ref={video} autoPlay playsInline muted className="max-h-44 w-full rounded bg-black object-contain" />
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" onClick={stopCamera}>Fechar câmera</Button>
          <Button type="button" size="sm" onClick={capturePhoto}>Fotografar</Button>
        </div>
      </div>}
      {part.photos.length > 0 && <div className="grid grid-cols-3 gap-2">{part.photos.map((photo, index) => (
        <div key={index} className="relative">
          <PhotoPreview photo={photo} label={`Foto ${index + 1}`} />
          <Button className="absolute right-1 top-1" variant="outline" size="icon" type="button"
            aria-label={`Remover foto ${index + 1}`} onClick={() => patch({ photos: part.photos.filter((_, i) => i !== index) })}><X /></Button>
        </div>
      ))}</div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end"><Button type="button" onClick={save}>Salvar peça</Button></div>
    </div>
  );
}
