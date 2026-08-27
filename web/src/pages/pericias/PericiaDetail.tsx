import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CarDiagram } from "@/components/pericia/CarDiagram";
import { PartDetailDialog } from "@/components/pericia/PartDetailDialog";
import { PhotoGallery } from "@/components/pericia/PhotoGallery";
import { RepairSummary } from "@/components/pericia/RepairSummary";
import { COMPLETE_PHOTO_SLOTS, TECH_PHOTO_SLOTS } from "@/constants/carParts";
import { REPAIR_TYPE_COLOR, REPAIR_TYPE_LABEL } from "@/constants/repairTypes";
import { periciaService } from "@/services/periciaService";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { normalizeReparos } from "@/utils/normalizeReparos";
import {
  PERICIA_STATUS_CLASS,
  PERICIA_STATUS_LABEL,
  PERICIA_TIPO_LABEL,
} from "@/utils/periciaStatus";
import type { Pericia } from "@/types/pericia";
import type { RepairType } from "@/types/carParts";

function displayValue(pericia: Pericia): number | null {
  return pericia.tipo === "completa" ? pericia.inspectionValue : pericia.suggestedPrice;
}

export default function PericiaDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [pericia, setPericia] = useState<Pericia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partDialogOpen, setPartDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPericia() {
      setLoading(true);
      setNotFound(false);

      try {
        const data = await periciaService.show(id);
        if (cancelled) return;
        setPericia(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPericia();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const partsState = useMemo(
    () => normalizeReparos(pericia?.repairs ?? []),
    [pericia?.repairs],
  );

  function handleSelectPart(partId: string) {
    setSelectedPartId(partId);
    setPartDialogOpen(true);
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);

    try {
      const { blob, filename } = await periciaService.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Perícia">
        <div className="flex justify-center py-20">
          <Spinner className="w-8 h-8" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !pericia) {
    return (
      <AppLayout title="Perícia">
        <div className="text-center py-20 text-muted-foreground">
          Perícia não encontrada.
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/pericias")}>
              Voltar para lista
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const value = displayValue(pericia);

  return (
    <AppLayout
      title={`Perícia #${pericia.id}`}
      subtitle={[pericia.licensePlate, pericia.model].filter(Boolean).join(" · ") || undefined}
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/pericias")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {pericia.status && (
          <Badge variant="outline" className={PERICIA_STATUS_CLASS[pericia.status]}>
            {PERICIA_STATUS_LABEL[pericia.status]}
          </Badge>
        )}

        {pericia.tipo && (
          <Badge variant="outline">{PERICIA_TIPO_LABEL[pericia.tipo]}</Badge>
        )}

        <Button
          size="sm"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="ml-auto"
        >
          <FileText className="w-4 h-4 mr-2" />
          {downloadingPdf ? "Gerando PDF..." : "Baixar PDF"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <SummaryCard label="Oficina" value={pericia.workshop} />
        <SummaryCard label="Técnico" value={pericia.technician} />
        <SummaryCard label="Placa" value={pericia.licensePlate} />
        <SummaryCard label="Chassi" value={pericia.chassis} />
        <SummaryCard label="Marca / modelo" value={pericia.model} />
        <SummaryCard label="Data" value={formatDateTime(pericia.createdAt)} />
        <SummaryCard label="Valor" value={formatCurrency(value)} />
        <SummaryCard
          label="Serviço vinculado"
          value={
            pericia.serviceId ? (
              <Link
                to={`/servicos/${pericia.serviceId}`}
                className="inline-flex items-center gap-1 text-[hsl(var(--app-accent))] hover:underline"
              >
                #{pericia.serviceId}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              "—"
            )
          }
        />
      </div>

      <div className="space-y-4">
        <PhotoGallery title="Fotos técnicas" slots={TECH_PHOTO_SLOTS} photos={pericia.photos} />

        {pericia.tipo === "completa" && (
          <PhotoGallery
            title="Fotos perícia completa"
            slots={COMPLETE_PHOTO_SLOTS}
            photos={pericia.completePhotos}
          />
        )}

        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-3">Diagrama do veículo</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Clique em uma peça com reparo para ver detalhes.
          </p>
          <CarDiagram
            partsState={partsState}
            selectedPartId={selectedPartId}
            onSelectPart={handleSelectPart}
          />
          <div className="flex flex-wrap gap-3 mt-4">
            {(Object.keys(REPAIR_TYPE_LABEL) as RepairType[]).map((type) => (
              <div key={type} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: REPAIR_TYPE_COLOR[type] }}
                  aria-hidden
                />
                {REPAIR_TYPE_LABEL[type]}
              </div>
            ))}
          </div>
        </div>

        <RepairSummary partsState={partsState} />
      </div>

      <PartDetailDialog
        open={partDialogOpen}
        partId={selectedPartId}
        value={selectedPartId ? partsState[selectedPartId] : null}
        onOpenChange={setPartDialogOpen}
      />
    </AppLayout>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium text-foreground">{value ?? "—"}</div>
    </div>
  );
}
