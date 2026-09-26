import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Spinner } from "@/components/ui/spinner";
import { userService } from "@/services/userService";
import { periciaService, type PriceVisibility } from "@/services/periciaService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { UserSelectionItem } from "@/types/user";

const DEFAULT_VISIBILITY: PriceVisibility={carro:false,desmontagem:false,total:false,sugerido:false};
function EditableValue({label,value,onChange,visible,onVisible,locked}:{
  label:string;value:number;onChange?:(v:number)=>void;visible:boolean;onVisible:(v:boolean)=>void;locked?:boolean;
}){
  return <div className="space-y-2 rounded-xl border border-border p-4">
    <Label>{label}</Label><CurrencyInput value={value} onChange={onChange??(()=>undefined)} disabled={locked}/>
    <label className="flex items-center gap-2 text-sm"><Switch checked={visible} onCheckedChange={onVisible}/>Exibir ao técnico</label>
  </div>;
}
export default function PericiaEdit() {
  const {id=""}=useParams();
  const navigate=useNavigate();
  const [workshops,setWorkshops]=useState<UserSelectionItem[]>([]);
  const [workshopId,setWorkshopId]=useState("");
  const [inspectorName,setInspectorName]=useState("");
  const [plate,setPlate]=useState("");
  const [chassis,setChassis]=useState("");
  const [brand,setBrand]=useState("");
  const [vehicleModel,setVehicleModel]=useState("");
  const [carValue,setCarValue]=useState(0);
  const [disassembly,setDisassembly]=useState(0);
  const [suggested,setSuggested]=useState(0);
  const [visibility,setVisibility]=useState<PriceVisibility>(DEFAULT_VISIBILITY);
  const [password,setPassword]=useState("");
  const [publicNumber,setPublicNumber]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const {markDirty,markSaved,confirmDiscard}=useUnsavedChanges();
  useEffect(()=>{
    let cancelled=false;
    Promise.all([periciaService.show(id),userService.listForSelection("OFICINA")]).then(([p,shops])=>{
      if(cancelled)return;
      setWorkshops(shops);setPublicNumber(p.publicNumber||`#${p.id}`);
      const shop=p.workshopId?shops.find(w=>w.id===p.workshopId):shops.find(w=>w.name===p.workshop);
      setWorkshopId(shop?String(shop.id):"");setInspectorName(p.inspectorName??"");
      setPlate(p.licensePlate??"");setChassis(p.chassis??"");
      setBrand(p.brand??"");setVehicleModel(p.vehicleModel??p.model??"");
      setCarValue(p.inspectionValue??p.suggestedPrice??0);
      setDisassembly(p.disassemblyValue??0);setSuggested(p.technicianSuggestedValue??0);
      setVisibility(p.priceVisibility??{carro:true,desmontagem:true,total:true,sugerido:true});
      markSaved();
    }).catch(error=>toast.error(getApiErrorMessage(error))).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[id,markSaved]);
  function setVisible(field:keyof PriceVisibility,v:boolean){setVisibility(c=>({...c,[field]:v}));markDirty();}
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!password){toast.error("Informe a senha do administrador.");return;}
    const joined=[brand.trim(),vehicleModel.trim()].filter(Boolean).join(" ");
    if(!workshopId||!plate.trim()||!chassis.trim()||!joined){toast.error("Preencha os campos obrigatórios.");return;}
    setSaving(true);
    try{
      const updated=await periciaService.update(id,{
        senha:password,oficina_id:Number(workshopId),placa:plate,chassi:chassis,
        marca_modelo:joined,marca:brand,modelo:vehicleModel,perito_nome:inspectorName,
        valor_pericia:carValue,valor_desmontagem:disassembly,
        valor_sugerido_tecnico:suggested,visibilidade_valores:visibility,
      });
      markSaved();toast.success(`Perícia ${updated.publicNumber||`#${updated.id}`} atualizada.`);navigate(`/pericias/${id}`);
    }catch(error){toast.error(getApiErrorMessage(error));}finally{setSaving(false);}
  }
  if(loading)return <AppLayout title="Editar perícia"><div className="py-20"><Spinner className="mx-auto h-8 w-8"/></div></AppLayout>;
  return <AppLayout title={`Editar perícia ${publicNumber||`#${id}`}`} subtitle="A edição exige a senha do administrador">
    <form onSubmit={submit} onChange={markDirty} className="space-y-4 max-w-5xl pb-8">
      <Button type="button" variant="outline" size="sm" onClick={()=>{if(confirmDiscard())navigate(`/pericias/${id}`);}}><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
      <section className="rounded-2xl border border-border bg-card p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Oficina</Label><SearchableSelect value={workshopId} onChange={v=>{setWorkshopId(v);markDirty();}} placeholder="Digite ou selecione a oficina" options={workshops.map(w=>({value:String(w.id),label:w.name}))}/></div>
        <div className="space-y-2"><Label>Nome do perito</Label><Input value={inspectorName} onChange={e=>setInspectorName(e.target.value)} placeholder="Perito responsável"/></div>
        <div className="space-y-2"><Label>Placa</Label><Input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())}/></div>
        <div className="space-y-2"><Label>Chassi</Label><Input value={chassis} onChange={e=>setChassis(e.target.value.toUpperCase())}/></div>
        <div className="space-y-2"><Label>Marca</Label><Input value={brand} onChange={e=>setBrand(e.target.value)}/></div>
        <div className="space-y-2"><Label>Modelo</Label><Input value={vehicleModel} onChange={e=>setVehicleModel(e.target.value)}/></div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Valores e visibilidade ao técnico</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <EditableValue label="Valor do veículo" value={carValue} onChange={v=>{setCarValue(v);markDirty();}} visible={visibility.carro} onVisible={v=>setVisible("carro",v)}/>
          <EditableValue label="Valor de desmontagem" value={disassembly} onChange={v=>{setDisassembly(v);markDirty();}} visible={visibility.desmontagem} onVisible={v=>setVisible("desmontagem",v)}/>
          <EditableValue label="Valor total (calculado)" value={Math.round((carValue+disassembly)*100)/100} locked visible={visibility.total} onVisible={v=>setVisible("total",v)}/>
          <EditableValue label="Valor sugerido pelo técnico" value={suggested} onChange={v=>{setSuggested(v);markDirty();}} visible={visibility.sugerido} onVisible={v=>setVisible("sugerido",v)}/>
        </div>
      </section>
      <section className="rounded-2xl border border-amber-500/30 bg-card p-5 space-y-3">
        <h2 className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4"/>Confirmação de segurança</h2>
        <div className="max-w-md space-y-2"><Label>Senha do administrador</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></div>
      </section>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving?"Salvando...":"Salvar edição"}</Button></div>
    </form>
  </AppLayout>;
}
