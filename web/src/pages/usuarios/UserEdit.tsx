import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userService } from "@/services/userService";
import type { AppUser } from "@/types/user";
import OficinaProfileTab from "./components/OficinaProfileTab";
import OficinaDocumentsTab from "./components/OficinaDocumentsTab";
import OficinaSupportTab from "./components/OficinaSupportTab";
import TecnicoProfileTab from "./components/TecnicoProfileTab";
import TecnicoDocumentsTab from "./components/TecnicoDocumentsTab";
import UsuarioSuspendTab from "./components/UsuarioSuspendTab";

export default function UserEdit() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("perfil");

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setLoading(true);

      try {
        const data = await userService.show(id);
        if (cancelled) return;
        setUser(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Editar usuário">
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !user) {
    return (
      <AppLayout title="Usuário não encontrado">
        <Button variant="outline" onClick={() => navigate("/usuarios")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </AppLayout>
    );
  }

  const isTech = user.profile === "TECNICO";
  const displayName = user.name || user.nickname || user.email;
  const isActive = user.status === "ativo";

  function handleUserUpdated(updated: AppUser) {
    setUser(updated);
  }

  return (
    <AppLayout title="Editar usuário" subtitle={displayName}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/usuarios")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para usuários
      </Button>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--app-accent))] text-black flex items-center justify-center font-bold text-lg shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
              <div className="flex gap-2 mt-1">
                <Badge variant={isTech ? "secondary" : "outline"}>
                  {isTech ? "Técnico" : "Oficina"}
                </Badge>
                {isActive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-transparent">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Suspenso</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="suporte">Suporte</TabsTrigger>
            <TabsTrigger value="suspenso">Suspenso</TabsTrigger>
          </TabsList>
          <TabsContent value="perfil" className="mt-6">
            {isTech ? (
              <TecnicoProfileTab
                user={user}
                onUserUpdated={handleUserUpdated}
                onDeleted={() => navigate("/usuarios")}
              />
            ) : (
              <OficinaProfileTab
                user={user}
                onUserUpdated={handleUserUpdated}
                onDeleted={() => navigate("/usuarios")}
              />
            )}
          </TabsContent>
          <TabsContent value="documentos" className="mt-6">
            {isTech ? (
              <TecnicoDocumentsTab userId={user.id} />
            ) : (
              <OficinaDocumentsTab userId={user.id} />
            )}
          </TabsContent>
          <TabsContent value="suporte" className="mt-6">
            <OficinaSupportTab userId={user.id} />
          </TabsContent>
          <TabsContent value="suspenso" className="mt-6">
            <UsuarioSuspendTab user={user} onUserUpdated={handleUserUpdated} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
