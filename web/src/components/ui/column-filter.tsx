import { useEffect, useRef, useState, type ReactNode } from "react";
import * as FilterDialog from "@radix-ui/react-dialog";
import { Filter } from "lucide-react";
import { Button } from "./button";

export function ColumnFilter({ label, active, onApply, children }: {
  label: string;
  active: boolean;
  onApply: (data?: FormData) => string | undefined;
  children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320, maxHeight: 320 });

  useEffect(() => {
    if (!open) return;
    function close() { setOpen(false); }
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  function changeOpen(next: boolean) {
    if (next && trigger.current) {
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 16);
      const top = Math.min(rect.bottom + 6, Math.max(8, window.innerHeight - 360));
      setPosition({ top, left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8), width, maxHeight: window.innerHeight - top - 8 });
      setError("");
    }
    setOpen(next);
  }

  function apply(data?: FormData) {
    const message = onApply(data);
    if (message) setError(message);
    else setOpen(false);
  }

  return (
    <FilterDialog.Root open={open} onOpenChange={changeOpen} modal={false}>
      <FilterDialog.Trigger ref={trigger} type="button" aria-label={`Filtrar ${label}${active ? " (ativo)" : ""}`}
        className={`inline-flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent ${active ? "bg-primary/15 text-primary" : ""}`}>
        {label}<Filter className={`h-3.5 w-3.5 shrink-0 ${active ? "fill-current" : ""}`} aria-hidden="true" />
      </FilterDialog.Trigger>
      <FilterDialog.Portal>
        <FilterDialog.Content aria-describedby={undefined} style={position} className="fixed z-50 overflow-y-auto rounded-lg border bg-popover p-4 text-left text-popover-foreground shadow-lg">
          <FilterDialog.Title className="mb-3 text-sm font-semibold">Filtrar {label}</FilterDialog.Title>
          <form className="space-y-3" onSubmit={event => { event.preventDefault(); apply(new FormData(event.currentTarget)); }}>
            {children}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => apply()}>Limpar filtro</Button>
              <Button type="submit" size="sm">Aplicar</Button>
            </div>
          </form>
        </FilterDialog.Content>
      </FilterDialog.Portal>
    </FilterDialog.Root>
  );
}
