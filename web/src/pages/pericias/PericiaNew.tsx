import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Camera, ChevronDown, ChevronUp, Info, LockKeyhole, Settings2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PhotoUploadSlot } from "@/components/pericia/PhotoUploadSlot";
import { CarDiagram } from "@/components/pericia/CarDiagram";
import { PartEditDialog } from "@/components/pericia/PartEditDialog";
import { CAR_PARTS, COMPLETE_PHOTO_SLOTS, TECH_PHOTO_SLOTS, VEHICLE_CAMERA_PHOTO_SLOTS } from "@/constants/carParts";
import { REPAIR_TYPE_LABEL } from "@/constants/repairTypes";
import { userService } from "@/services/userService";
import { periciaService, type VehiclePhotoField, type PriceVisibility } from "@/services/periciaService";
import { buildPericiaFormData, createInitialPartsState } from "@/utils/buildPericiaFormData";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { PartInspection, RepairType } from "@/types/carParts";
import type { UserSelectionItem } from "@/types/user";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const PHOTO_SLOTS = [...TECH_PHOTO_SLOTS, ...VEHICLE_CAMERA_PHOTO_SLOTS];
const VISIBILITY_DEFAULT: PriceVisibility = { carro: false, desmontagem: false, total: false, sugerido: false };
const TYPES = Object.entries(REPAIR_TYPE_LABEL) as [RepairType, string][];
function emptyPhotos(slots: readonly {key: string}[]): Record<string, File | null> {
  return Object.fromEntries(slots.map((slot) => [slot.key, null]));
}
function Card({number, title, hint, children}: {number: number; title: string; hint?: string; children: React.ReactNode}) {
  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5">
    <header className="flex gap-3 items-center border-b border-border pb-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white font-bold">T{number}</span>
      <div><h2 className="font-semibold text-base">{title}</h2>{hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}</div>
    </header>{children}
  </section>;
}
function CameraField({field, label, value, placeholder, photo, onValue, onPhoto}: {
  field: VehiclePhotoField; label: string; value: string; placeholder: string; photo: File | null;
  onValue: (next: string) => void; onPhoto: (file: File) => void;
}) {
  return <div className="space-y-2">
    <Label htmlFor={`vehicle-${field}`}>{label}</Label>
    <div className="flex gap-2">
      <Input id={`vehicle-${field}`} value={value} onChange={(e) => onValue(e.target.value)} placeholder={placeholder} />
      <label title={`Fotografar ${label.toLowerCase()}`} aria-label={`Fotografar ${label}`} className="flex h-10 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input hover:bg-muted">
        <Camera className="h-4 w-4" />
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]; if (file) onPhoto(file); e.target.value = "";
        }} />
      </label>
    </div>
    {photo && <p className="text-xs text-emerald-600">Foto anexada: {photo.name}. Confira o texto reconhecido antes de salvar.</p>}
  </div>;
}
function PriceField({label, value, onChange, visible, onVisible, locked, note}: {
  label: string; value: number; onChange?: (value: number) => void;
  visible: boolean; onVisible: (value: boolean) => void; locked?: boolean; note?: string;
}) {
  return <div className="rounded-xl border border-border p-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <div className="space-y-2"><Label>{label}</Label><CurrencyInput value={value} onChange={onChange ?? (() => undefined)} disabled={locked}/>{note && <p className="text-xs text-muted-foreground">{note}</p>}</div>
    <label className="flex items-center gap-2 text-xs cursor-pointer sm:pb-3"><Switch checked={visible} onCheckedChange={onVisible}/><span>Exibir ao técnico</span></label>
  </div>;
}

export default function PericiaNew() {
  const navigate = useNavigate();
  const {markDirty, markSaved, confirmDiscard} = useUnsavedChanges();
  const [workshops, setWorkshops] = useState<UserSelectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workshopId, setWorkshopId] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [plate, setPlate] = useState("");
  const [chassis, setChassis] = useState("");
  const [brand, setBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [photos, setPhotos] = useState<Record<string,File|null>>(() => emptyPhotos(PHOTO_SLOTS));
  const [extraPhotos, setExtraPhotos] = useState<Record<string,File|null>>(() => emptyPhotos(COMPLETE_PHOTO_SLOTS));
  const [kind, setKind] = useState<"simples"|"completa">("simples");
  const [coefficient, setCoefficient] = useState(0);
  const [parts, setParts] = useState<Record<string,PartInspection>>(createInitialPartsState);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [manualCarValue, setManualCarValue] = useState(0);
  const [disassembly, setDisassembly] = useState(0);
  const [suggestedByTech, setSuggestedByTech] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<PriceVisibility>(VISIBILITY_DEFAULT);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [recognizing, setRecognizing] = useState<VehiclePhotoField | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dents = useMemo(() => Object.values(parts).reduce((sum,p) => sum + Math.max(0,p.dentCount),0),[parts]);
  const carValue = kind === "completa" ? Math.round(dents * coefficient * 100)/100 : manualCarValue;
  const total = Math.round((carValue + disassembly)*100)/100;
  const model = [brand.trim(),vehicleModel.trim()].filter(Boolean).join(" ");

  useEffect(() => {
    let cancelled = false;
    Promise.all([userService.listForSelection("OFICINA"), periciaService.getSettings()])
      .then(([shops, settings]) => {if (!cancelled) {setWorkshops(shops);setCoefficient(Number(settings.coeficiente_eur));}})
      .catch(error => toast.error(getApiErrorMessage(error)))
      .finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, []);

  function updatePart(id: string, value: Partial<PartInspection>) {
    setParts(current => ({...current,[id]:{...current[id],...value}})); markDirty();
  }
  function toggleVisibility(key: keyof PriceVisibility, next: boolean) {
    setVisibility(current => ({...current,[key]:next})); markDirty();
  }
  async function capture(field: VehiclePhotoField, file: File) {
    const key = {placa:"vehicle_plate",chassi:"vehicle_chassis",marca:"vehicle_brand",modelo:"vehicle_model"}[field];
    setPhotos(current => ({...current,[key]:file})); markDirty();
    setRecognizing(field);
    try {
      const recognized = await periciaService.recognizePhoto(field,file);
      if (!recognized) {toast.message("Foto anexada. Não foi possível reconhecer esse campo; preencha manualmente."); return;}
      if (field === "placa") setPlate(recognized.toUpperCase());
      if (field === "chassi") setChassis(recognized.toUpperCase());
      if (field === "marca") setBrand(recognized);
      if (field === "modelo") setVehicleModel(recognized);
      toast.success(`${field}: texto identificado. Confira antes de salvar.`);
    } catch (error) {toast.info(getApiErrorMessage(error) || "Foto anexada; digite o campo manualmente.");}
    finally {setRecognizing(null);}
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string,string>={};
    if (!workshopId) next.oficina_id="Selecione uma oficina.";
    if (!inspectorName.trim()) next.perito_nome="Informe o nome do perito (não é um técnico).";
    if (!plate.trim()) next.placa="Informe a placa.";
    if (!chassis.trim()) next.chassi="Informe o chassi.";
    if (!brand.trim()) next.marca="Informe a marca.";
    if (!vehicleModel.trim()) next.modelo="Informe o modelo.";
    if (kind === "completa" && coefficient <= 0) next.tipo="Configure um coeficiente maior que zero antes de salvar a perícia convencional.";
    setErrors(next);
    if (Object.keys(next).length) {toast.error("Confira os campos obrigatórios.");return;}
    setSubmitting(true);
    try {
      const payload = buildPericiaFormData({
        workshopId:Number(workshopId), technicianId:null, inspectorName:inspectorName.trim(),
        licensePlate:plate.toUpperCase().trim(), chassis:chassis.toUpperCase().trim(), model,
        brand:brand.trim(),vehicleModel:vehicleModel.trim(),tipo:kind,includeValue:true,
        inspectionValue:carValue,suggestedPrice:null,technicianSuggestedValue:suggestedByTech,
        disassemblyValue:disassembly,priceVisibility:visibility,photos,completePhotos:extraPhotos,partsState:parts,
      });
      const created = await periciaService.create(payload);
      markSaved(); toast.success(`Perícia ${created.publicNumber || `#${created.id}`} criada.`);
      navigate(`/pericias/${created.id}`);
    } catch (error) {
      setErrors(Object.fromEntries(Object.entries(getApiValidationErrors(error) ?? {}).map(([k,v])=>[k,v])));
      toast.error(getApiErrorMessage(error));
    } finally {setSubmitting(false);}
  }
  return <AppLayout title="Nova perícia" subtitle="Cadastro administrativo em 6 etapas (T1 a T6)">
    <form className="space-y-5 pb-8" onSubmit={submit} onChange={markDirty}>
      <Button type="button" variant="outline" size="sm" onClick={() => {if(confirmDiscard())navigate("/pericias");}}><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button>

      <Card number={1} title="Responsáveis" hint="A pessoa que faz a perícia é o perito, não o técnico responsável pelo reparo.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Oficina</Label><SearchableSelect value={workshopId} onChange={value=>{setWorkshopId(value);markDirty();}} disabled={loading} placeholder="Digite ou selecione a oficina" options={workshops.map(w=>({value:String(w.id),label:w.name}))}/>{errors.oficina_id && <p className="text-xs text-destructive">{errors.oficina_id}</p>}</div>
          <div className="space-y-2"><Label>Nome do perito</Label><Input value={inspectorName} onChange={e=>setInspectorName(e.target.value)} placeholder="Nome de quem realizou a perícia" />{errors.perito_nome && <p className="text-xs text-destructive">{errors.perito_nome}</p>}<p className="text-xs text-muted-foreground">Cadastro nominal independente; futuro módulo de peritos não usa a lista de técnicos.</p></div>
        </div>
      </Card>

      <Card number={2} title="Informações do veículo" hint="Digite os dados ou use a câmera; as imagens serão incluídas automaticamente na T3.">
        <div className="grid gap-4 md:grid-cols-2">
          <CameraField field="placa" label="Placa" value={plate} placeholder="AB123CD" photo={photos.vehicle_plate} onValue={v=>setPlate(v.toUpperCase())} onPhoto={file=>void capture("placa",file)}/>
          <CameraField field="chassi" label="Chassi" value={chassis} placeholder="Informe o chassi" photo={photos.vehicle_chassis} onValue={v=>setChassis(v.toUpperCase())} onPhoto={file=>void capture("chassi",file)}/>
          <CameraField field="marca" label="Marca" value={brand} placeholder="Ex.: Volkswagen" photo={photos.vehicle_brand} onValue={setBrand} onPhoto={file=>void capture("marca",file)}/>
          <CameraField field="modelo" label="Modelo" value={vehicleModel} placeholder="Ex.: Gol" photo={photos.vehicle_model} onValue={setVehicleModel} onPhoto={file=>void capture("modelo",file)}/>
        </div>
        {recognizing && <p className="text-sm text-sky-600 flex items-center gap-2"><Camera className="h-4 w-4"/>Analisando foto de {recognizing}... Se a IA não estiver configurada, a foto continua salva para envio.</p>}
        {["placa","chassi","marca","modelo"].map(k=>errors[k]&&<p key={k} className="text-xs text-destructive">{errors[k]}</p>)}
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4"/>O modelo 3D exato aparece quando houver arquivo licenciado no catálogo; os demais veículos usam o modelo técnico genérico.</p>
      </Card>

      <Card number={3} title="Fotografias técnicas" hint="Miniaturas lado a lado: as fotos capturadas na etapa anterior já aparecem aqui.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {PHOTO_SLOTS.map(slot=><PhotoUploadSlot key={slot.key} label={slot.label} file={photos[slot.key]??null} onChange={file=>{setPhotos(current=>({...current,[slot.key]:file}));markDirty();}}/>) }
          {COMPLETE_PHOTO_SLOTS.map(slot=><PhotoUploadSlot key={slot.key} label={slot.label} file={extraPhotos[slot.key]??null} onChange={file=>{setExtraPhotos(current=>({...current,[slot.key]:file}));markDirty();}}/>) }
        </div>
      </Card>

      <Card number={4} title="Tipo de perícia" hint="A básica recebe o valor manual; a convencional usa a quantidade de amassados e o coeficiente cadastrado.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-xl border p-4 ${kind==="simples"?"border-sky-500 bg-sky-500/10":"border-border"}`}><input type="radio" name="tipo" checked={kind==="simples"} onChange={()=>{setKind("simples");markDirty();}}/> <span className="font-semibold ml-2">Perícia básica</span><p className="mt-1 pl-6 text-xs text-muted-foreground">Valor do veículo preenchido manualmente.</p></label>
          <label className={`cursor-pointer rounded-xl border p-4 ${kind==="completa"?"border-sky-500 bg-sky-500/10":"border-border"}`}><input type="radio" name="tipo" checked={kind==="completa"} onChange={()=>{setKind("completa");markDirty();}}/> <span className="font-semibold ml-2">Perícia convencional</span><p className="mt-1 pl-6 text-xs text-muted-foreground">Valor calculado pelo coeficiente.</p></label>
        </div>
        {kind === "completa" && <p className="text-sm rounded-xl bg-muted p-3">Coeficiente cadastrado: <strong>€ {coefficient.toFixed(2)}</strong> × <strong>{dents}</strong> amassados = <strong>€ {carValue.toFixed(2)}</strong>. <Link to="/configuracoes" className="inline-flex items-center gap-1 underline ml-1"><Settings2 className="h-3 w-3"/>Configurações</Link></p>}
        {errors.tipo && <p className="text-sm text-destructive">{errors.tipo}</p>}
      </Card>

      <Card number={5} title="Mapa 3D e resumo de reparos" hint="Clique no carro ou edite diretamente cada peça na tabela; todas as peças aparecem, mesmo sem dano.">
        <CarDiagram partsState={parts} selectedPartId={selectedPartId} onSelectPart={id=>{setSelectedPartId(id);setPartDialogOpen(true);}} vehicleModel={model} canEdit/>
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Todas as peças</h3><Button type="button" variant="outline" size="sm" onClick={()=>setExpanded(v=>!v)}>{expanded?<ChevronUp className="h-4 w-4 mr-1"/>:<ChevronDown className="h-4 w-4 mr-1"/>}{expanded?"Ver somente resumo":"Abrir todos os detalhes"}</Button></div>
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {CAR_PARTS.map(part=>{
            const state=parts[part.id];
            return <div key={part.id} className="p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-[minmax(120px,1fr)_minmax(150px,1fr)_90px_auto] sm:items-center">
                <span className="text-sm font-medium">{part.label}</span>
                <select aria-label={`Reparo ${part.label}`} value={state.repairType} onChange={e=>updatePart(part.id,{repairType:e.target.value as RepairType})} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {TYPES.map(([key,label])=><option value={key} key={key}>{label}</option>)}
                </select>
                <Input aria-label={`Amassados ${part.label}`} type="number" min={0} value={state.dentCount} onChange={e=>updatePart(part.id,{dentCount:Math.max(0,Number(e.target.value)||0)})}/>
                <Button type="button" variant="outline" size="sm" onClick={()=>{setSelectedPartId(part.id);setPartDialogOpen(true);}}>Fotos / detalhes</Button>
              </div>
              {expanded && <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="space-y-1"><Label>Impactos maiores que 25</Label><Input type="number" min={0} value={state.impactsOver25} onChange={e=>updatePart(part.id,{impactsOver25:Math.max(0,Number(e.target.value)||0)})}/></div>
                <div className="space-y-1"><Label>Impactos menores que 25</Label><Input type="number" min={0} value={state.impactsUnder25} onChange={e=>updatePart(part.id,{impactsUnder25:Math.max(0,Number(e.target.value)||0)})}/></div>
                <div className="space-y-1"><Label>Observações</Label><Input value={state.notes} onChange={e=>updatePart(part.id,{notes:e.target.value})}/></div>
              </div>}
            </div>;
          })}
        </div>
        <p className="text-sm text-muted-foreground">Total de amassados registrados: <strong>{dents}</strong></p>
      </Card>

      <Card number={6} title="Valores e visibilidade" hint="Cada valor possui seu próprio controle de exibição para o técnico; desativado mantém o valor reservado à administração.">
        <div className="grid gap-3 lg:grid-cols-2">
          <PriceField label="Valor do veículo" value={carValue} onChange={v=>{setManualCarValue(v);markDirty();}} locked={kind==="completa"} visible={visibility.carro} onVisible={v=>toggleVisibility("carro",v)} note={kind==="completa"?`Automático: ${dents} × € ${coefficient.toFixed(2)}.`:"Preenchimento manual na perícia básica."}/>
          <PriceField label="Valor de desmontagem" value={disassembly} onChange={v=>{setDisassembly(v);markDirty();}} visible={visibility.desmontagem} onVisible={v=>toggleVisibility("desmontagem",v)}/>
          <PriceField label="Valor total" value={total} locked visible={visibility.total} onVisible={v=>toggleVisibility("total",v)} note="Soma automática: veículo + desmontagem."/>
          <PriceField label="Valor sugerido pelo técnico" value={suggestedByTech ?? 0} onChange={v=>{setSuggestedByTech(v);markDirty();}} visible={visibility.sugerido} onVisible={v=>toggleVisibility("sugerido",v)} note="Registre a sugestão quando ela estiver disponível."/>
        </div>
        <p className="flex gap-2 items-center text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4"/>O controle de exibição é salvo com a perícia. Confira os acessos do aplicativo antes de oferecer os valores ao técnico.</p>
      </Card>
      <div className="flex justify-end"><Button type="submit" disabled={loading||submitting||!!recognizing}>{submitting?"Salvando...":"Salvar perícia"}</Button></div>
    </form>
    <PartEditDialog open={partDialogOpen} partId={selectedPartId} value={selectedPartId?parts[selectedPartId]:null} completeInspection={kind==="completa"} onOpenChange={setPartDialogOpen} onSave={value=>{
      if (!selectedPartId) return; setParts(current=>({...current,[selectedPartId]:value})); markDirty();setPartDialogOpen(false);
    }}/>
  </AppLayout>;
}
