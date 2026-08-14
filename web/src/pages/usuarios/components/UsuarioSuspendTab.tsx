import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { AppUser } from "@/types/user";

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
};

export default function UsuarioSuspendTab({ user, onUserUpdated }: Props) {
  const isActive = user.status === "ativo";
  const profileLabel = user.profile === "TECNICO" ? "técnico" : "oficina";

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSuspend() {
    setProcessing(true);
    try {
      const { message, data } = await userService.toggleStatus(user.id);
      onUserUpdated(data);
      toast.success(message);
      setSuspendOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  }

  async function handleReactivate() {
    if (!adminPassword.trim()) {
      toast.error("Informe a senha do administrador");
      return;
    }

    setProcessing(true);
    try {
      const { message, data } = await userService.toggleStatus(user.id, adminPassword);
      onUserUpdated(data);
      toast.success(message);
      setAdminPassword("");
      setReactivateOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Suspenso</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Suspenda o acesso ao app ou reative a {profileLabel}. A reativação exige senha do administrador.
        </p>
      </div>

      <div className="border border-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Status atual</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isActive
                ? "Usuário pode acessar o aplicativo."
                : "Usuário suspenso — sem acesso ao aplicativo."}
            </p>
          </div>
          {isActive ? (
            <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-transparent">
              Ativo
            </Badge>
          ) : (
            <Badge variant="secondary">Suspenso</Badge>
          )}
        </div>

        {isActive ? (
          <Button type="button" variant="destructive" onClick={() => setSuspendOpen(true)}>
            Suspender {profileLabel}
          </Button>
        ) : (
          <Button type="button" onClick={() => setReactivateOpen(true)}>
            Reativar {profileLabel}
          </Button>
        )}
      </div>

      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender {profileLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá acesso ao aplicativo até ser reativado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleSuspend();
              }}
              disabled={processing}
            >
              {processing ? "Aguarde..." : "Suspender"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reactivateOpen}
        onOpenChange={(open) => {
          setReactivateOpen(open);
          if (!open) setAdminPassword("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar {profileLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Digite a senha do administrador para confirmar a reativação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Senha do administrador</Label>
            <Input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReactivate();
              }}
              disabled={processing}
            >
              {processing ? "Aguarde..." : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
