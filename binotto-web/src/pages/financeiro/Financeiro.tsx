import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { financeEntries as seedEntries, type FinanceEntry } from "@/data/financeMock";
import { Receivables } from "./tabs/Receivables";
import { Payables } from "./tabs/Payables";
import { CashFlow } from "./tabs/CashFlow";
import { Reports } from "./tabs/Reports";

export default function Financeiro() {
  const [entries] = useState<FinanceEntry[]>(seedEntries);
  const [tab, setTab] = useState("receber");

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
        <TabsContent value="receber">
          <Receivables />
        </TabsContent>
        <TabsContent value="pagar">
          <Payables />
        </TabsContent>
        <TabsContent value="fluxo">
          <CashFlow />
        </TabsContent>
        <TabsContent value="relatorios">
          <Reports entries={entries} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
