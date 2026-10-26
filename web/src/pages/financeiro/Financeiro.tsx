import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { receivableService } from "@/services/receivableService";
import { payableService } from "@/services/payableService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { Receivable, Payable } from "@/types/finance";
import { Receivables } from "./tabs/Receivables";
import { Payables } from "./tabs/Payables";
import { CashFlow } from "./tabs/CashFlow";
import { Reports } from "./tabs/Reports";

export default function Financeiro() {
  const [tab, setTab] = useState("receber");
  const [reportData, setReportData] = useState<{receivables: Receivable[]; payables: Payable[]; complete: boolean} | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  useEffect(() => {
    if (tab !== "relatorios") return;
    let cancelled = false;
    async function load() {
      setReportLoading(true);
      try {
        const [r, p] = await Promise.all([
          receivableService.list({page: 1, per_page: 500}),
          payableService.list({page: 1, per_page: 500}),
        ]);
        if (!cancelled) setReportData({
          receivables: r.data, payables: p.data,
          complete: r.meta.last_page <= 1 && p.meta.last_page <= 1,
        });
      } catch (error) {
        if (!cancelled) { setReportData(null); toast.error(getApiErrorMessage(error)); }
      } finally { if (!cancelled) setReportLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <AppLayout title="Financeiro" subtitle="Contas, fluxo de caixa e relatórios">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto mb-4">
          <TabsList>
            <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
            <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="receber"><Receivables /></TabsContent>
        <TabsContent value="pagar"><Payables /></TabsContent>
        <TabsContent value="fluxo"><CashFlow /></TabsContent>
        <TabsContent value="relatorios">
          {reportLoading ? <p className="p-6 text-sm text-muted-foreground">Carregando lançamentos reais...</p> :
            reportData ? <Reports receivables={reportData.receivables} payables={reportData.payables} complete={reportData.complete} /> :
            <p className="p-6 text-sm text-destructive">Não foi possível carregar os dados reais. Nenhum relatório foi calculado.</p>}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
