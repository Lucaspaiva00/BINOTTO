import { useState } from "react";
import { toast } from "sonner";
import { ShieldBan, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function UserSuspendAction({ user, onUserUpdated }: Props) {
  const isActive = user.status === "ativo";
  const label = user.profile === "TECNICO" ? "técnico" : "oficina";
  const [open, setOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleConfirm() {
    if (!isActive && !adminPassword.trim()) {
      toast.error("Informe a senha do administrador para reativar.");
      return;
    }

    setProcessing(true);
    try {
      const { message, data } = await userService.toggleStatus(
        user.id,
        isActive ? undefined : adminPassword,
      );
      onUserUpdated(data);
      toast.success(message);
      setAdminPassword("");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="font-semibold">Acesso ao sistema</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        {isActive
          ? `Suspenda o acesso do ${label} sem excluir o cadastro ou o histórico.`
          : `O ${label} está suspenso. A reativação exige a senha do administrador.`}
      </p>
      <Button
        type="button"
        variant={isActive ? "destructive" : "outline"}
        onClick={() => setOpen(true)}
      >
        {isActive ? (
          <ShieldBan className="w-4 h-4 mr-2" />
        ) : (
          <ShieldCheck className="w-4 h-4 mr-2" />
        )}
        {isActive ? "Suspender" : "Reativar"}
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setAdminPassword("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? `Suspender ${label}?` : `Reativar ${label}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? "O cadastro e o histórico serão mantidos, mas o usuário perderá o acesso até ser reativado."
                : "Digite a senha do administrador para liberar novamente o acesso."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!isActive && (
            <div className="space-y-2 py-2">
              <Label>Senha do administrador</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={processing}
            >
              {processing ? "Aguarde..." : isActive ? "Suspender" : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
