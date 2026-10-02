import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, ClipboardList, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService } from "@/services/userService";
import { serviceService } from "@/services/serviceService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { getApiValidationErrors } from "@/utils/getApiValidationErrors";
import type { PartInspection } from "@/types/carParts";
import type { UserSelectionItem } from "@/types/user";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ServiceAdminForm, initialServiceForm, type ServiceAdminFormState } from "./ServiceAdminForm";
import { ServicePartDialog } from "./ServicePartDialog";
import { buildServiceDetailsFormData, createInitialServiceParts, validateDetails, parseAmount, SERVICE_PARTS_ORDER } from "./serviceDetails";

export default function ServicoNew() {
  const navigate = useNavigate();
  const [form,setForm] = useState<ServiceAdminFormState>(() => ({ ...initialServiceForm(), status: "em_breve" }));
  const [workshops,setWorkshops] = useState<UserSelectionItem[]>([]);
  const [technicians,setTechnicians] = useState<UserSelectionItem[]>([]);
  const [loading,setLoading] = useState(true);
  const [startDate,setStartDate] = useState("");
  const [endDate,setEndDate] = useState("");
  const [quantityType,setQuantityType] = useState<"carros"|"dias">("carros");
  const [quantity,setQuantity] = useState("1");
  const [partsState,setPartsState] = useState<Record<string,PartInspection>>(createInitialServiceParts);
  const [selectedPartId,setSelectedPartId] = useState<string|null>(null);
  const [editingPart,setEditingPart] = useState<PartInspection|null>(null);
  const [errors,setErrors] = useState<Record<string,string>>({});
  const [saving,setSaving] = useState(false);
  const {markDirty, markSaved, confirmDiscard} = useUnsavedChanges();
  const selectedWorkshop = workshops.find(w=>String(w.id)===form.workshopId);

  useEffect(()=>{
    let cancelled=false;
    Promise.all([userService.listForSelection("OFICINA"),userService.listForSelection("TECNICO")])
      .then(([shops,techs])=>{if(!cancelled){setWorkshops(shops);setTechnicians(techs);}})
      .catch(err=>toast.error(getApiErrorMessage(err)))
      .finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
  },[]);
  function change<K extends keyof ServiceAdminFormState>(field:K,next:ServiceAdminFormState[K]) {
    setForm(current=>({...current,[field]:next}));markDirty();
  }
  function openPart(partId:string) {
    setSelectedPartId(partId);setEditingPart({...partsState[partId], photos:[...partsState[partId].photos]});
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault();
    const next:Record<string,string>={};
    const detailError = validateDetails(form, partsState);
    if(detailError) {toast.error(detailError);return;}
    const carPrice = form.detailedPrices.oficina_carro;
    const techPrice = form.detailedPrices.tecnico_carro;
    const price=carPrice.tipo === "valor" ? parseAmount(carPrice.valor) : 0;
    const pay=parseAmount(techPrice.valor);
    if(!form.serviceDate) next.serviceDate="Informe a data do serviço.";
    if(!form.workshopId) next.workshopId="Selecione a oficina.";
    if(selectedWorkshop?.canRequestTechnician===false) next.workshopId="Complete o endereço da oficina antes de criar a solicitação.";
    if(!startDate) next.startDate="Informe a data inicial.";
    if(startDate&&endDate&&endDate<startDate) next.endDate="A data final não pode anteceder a inicial.";
    if(!Number.isInteger(Number(quantity))||Number(quantity)<1) next.quantity="Quantidade inválida.";
    if(!Number.isFinite(price)||price<0) next.price="Informe um preço válido.";
    if(!Number.isFinite(pay)||pay<0||(techPrice.tipo==="porcentagem"&&pay>100)) next.compensationValue="Informe valor válido; porcentagem máxima: 100%.";
    setErrors(next);
    if(Object.keys(next).length) {toast.error("Verifique os campos da solicitação.");return;}
    setSaving(true);
    let createdId: number | null = null;
    try {
      const created=await serviceService.createRequest({
        modo_completo:true,
        oficina_id:Number(form.workshopId), status:form.status,
        data_servico:form.serviceDate, tecnico_nome_manual:form.technicianId?null:form.manualTechnicianName.trim()||null,
        tecnico_id:form.technicianId?Number(form.technicianId):null,
        data_inicio:startDate, data_fim:endDate||startDate,
        quantidade_tipo:quantityType, quantidade:Number(quantity),
        placa:form.plate.trim()||null, chassi:form.chassis.trim()||null,
        marca_modelo:`${form.brand} ${form.vehicleModel}`.trim()||null,
        valor_total:price,
        remuneracao_tipo:techPrice.tipo,
        remuneracao_tecnico:pay,
        observacoes:form.notes.trim()||undefined,
        reparos_execucao:SERVICE_PARTS_ORDER.map(id=>({id})).filter(part=>{
          const state=partsState[part.id];
          return state.repairType!=="SEM_DANO"||state.dentCount>0||state.notes.trim().length>0;
        }).map(part=>{
          const state=partsState[part.id];
          return {peca:part.id,tipoReparo:state.repairType,quantidadeAmassados:state.dentCount,quantidadeImpactosMaior25:state.impactsOver25,quantidadeImpactosMenor25:state.impactsUnder25,observacoes:state.notes};
        }),
      });
      createdId=created.id;
      await serviceService.saveDetails(created.id,buildServiceDetailsFormData(form,partsState));
      markSaved();toast.success(`Solicitação #${created.id} criada.`);navigate("/servicos");
    }catch(error){
      const val=getApiValidationErrors(error);
      if(val) setErrors(Object.fromEntries(Object.entries(val).map(([k,v])=>[({oficina_id:"workshopId",valor_total:"price",remuneracao_tecnico:"compensationValue",data_inicio:"startDate",data_fim:"endDate"} as Record<string,string>)[k]??k,v])));
      if(createdId){toast.warning(`Solicitação #${createdId} criada, mas os detalhes não foram salvos. Complete a edição.`);navigate(`/servicos/${createdId}`);}
      else toast.error(getApiErrorMessage(error));
    }finally{setSaving(false);}
  }
  return <AppLayout title="Criar solicitação" subtitle="Oficina, estado, técnico opcional, veículo, reparos e preço">
    <form onSubmit={submit} onChange={markDirty} className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={()=>{if(confirmDiscard())navigate("/servicos");}}><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
        <Button type="submit" disabled={saving||loading}><Save className="mr-2 h-4 w-4"/>{saving?"Salvando...":"Criar solicitação"}</Button>
      </div>
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Período e quantidade da solicitação</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Data inicial</Label><DateInput value={startDate} onChange={e=>setStartDate(e.target.value)}/>{errors.startDate&&<p className="text-xs text-destructive">{errors.startDate}</p>}</div>
          <div className="space-y-2"><Label>Data final</Label><DateInput value={endDate} onChange={e=>setEndDate(e.target.value)}/>{errors.endDate&&<p className="text-xs text-destructive">{errors.endDate}</p>}</div>
          <div className="space-y-2"><Label>Unidade</Label><Select value={quantityType} onValueChange={v=>{setQuantityType(v as "carros"|"dias");markDirty();}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="carros">Carros</SelectItem><SelectItem value="dias">Dias</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Quantidade</Label><Input type="number" min={1} value={quantity} onChange={e=>setQuantity(e.target.value)}/>{errors.quantity&&<p className="text-xs text-destructive">{errors.quantity}</p>}</div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4"/>Sem técnico selecionado, a solicitação fica disponível para interessados. Se selecionar um técnico, ela será direcionada a ele.</p>
      </section>
      <fieldset disabled={saving || loading} className="min-w-0">
      <ServiceAdminForm value={form} onChange={change} workshops={workshops} technicians={technicians} partsState={partsState} onPartSelect={openPart}
        onPartChange={(id,part)=>{setPartsState(prev=>({...prev,[id]:part}));markDirty();}} errors={errors}/>
      </fieldset>
      <div className="flex justify-end"><Button type="submit" disabled={saving||loading}>{saving?"Salvando...":"Criar solicitação"}</Button></div>
    </form>
    <ServicePartDialog partId={selectedPartId} value={editingPart} onClose={()=>{setSelectedPartId(null);setEditingPart(null);}}
      onSave={value=>{setEditingPart(value);if(selectedPartId)setPartsState(prev=>({...prev,[selectedPartId]:value}));setSelectedPartId(null);setEditingPart(null);markDirty();}}/>
  </AppLayout>;
}
