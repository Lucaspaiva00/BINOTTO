import { useState } from "react";
import { Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
export function InvoiceAttachment({kind,id,attached,onUploaded}:{kind:"receber"|"pagar";id:number;attached?:boolean;onUploaded?:()=>void}) {
 const [busy,setBusy]=useState(false);
 const [preview,setPreview]=useState<string|null>(null);
 async function upload(file:File) { if(file.size>5*1024*1024){toast.error("Limite de 5 MB.");return;} setBusy(true);try { const form=new FormData();form.append("arquivo",file);await api.post(`/contas-${kind}/${id}/fatura`,form);toast.success("Fatura anexada.");onUploaded?.(); }catch(e){toast.error(getApiErrorMessage(e));}finally{setBusy(false);} }
 async function view(){setBusy(true);try{const {data}=await api.get(`/contas-${kind}/${id}/fatura`,{responseType:"blob"});const url=URL.createObjectURL(data);setPreview(url);}catch(e){toast.error(getApiErrorMessage(e));}finally{setBusy(false);}}
 return <><div className="flex gap-2 items-center" onClick={e=>e.stopPropagation()}>{attached&&<Button disabled={busy} size="sm" variant="outline" aria-label="Ver fatura" onClick={()=>void view()}><Eye className="h-4 w-4"/></Button>}{onUploaded&&<label className="cursor-pointer text-sm inline-flex gap-1 items-center"><Upload className="h-4 w-4"/>{busy?"Enviando...":"Anexar fatura"}<input disabled={busy} className="hidden" type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value="";}}/></label>}</div><Dialog open={Boolean(preview)} onOpenChange={open=>{if(!open&&preview){URL.revokeObjectURL(preview);setPreview(null);}}}><DialogContent className="max-w-5xl"><DialogHeader><DialogTitle>Fatura</DialogTitle></DialogHeader>{preview&&<><iframe title="Fatura anexada" src={preview} className="w-full h-[65vh] rounded border"/><a href={preview} download="fatura" className="text-sm underline">Baixar fatura</a></>}</DialogContent></Dialog></>;
}
export function InvoiceStatus({status}:{status?:string|null}) {
 const styles:Record<string,string>={emitida:"bg-blue-500/15 text-blue-700",enviada:"bg-yellow-500/15 text-yellow-700",paga:"bg-green-500/15 text-green-700"};
 return <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${styles[status??""]??"bg-muted text-muted-foreground"}`}><span className="h-2 w-2 rounded-full bg-current"/>{status==="emitida"?"Emitida":status==="enviada"?"Enviada":status==="paga"?"Paga":status||"Sem fatura"}</span>;
}
