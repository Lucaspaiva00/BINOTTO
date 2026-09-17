import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export type SearchableOption = { value: string; label: string; disabled?: boolean };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchableSelect({ value, onChange, options, placeholder = "Selecionar", disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    if (selected?.label) setSelectedLabel(selected.label);
  }, [selected?.label, value]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLocaleLowerCase().includes(term));
  }, [options, query]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="border-input dark:bg-input/30 flex h-10 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label ?? (selectedLabel || placeholder)}
        </span>
        <span className="text-muted-foreground">⌄</span>
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite para pesquisar..."
              className="pl-8"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum resultado.</p>
            ) : filtered.map((option) => (
              <button
                type="button"
                key={option.value}
                disabled={option.disabled}
                onClick={() => {
                  setSelectedLabel(option.label);
                  onChange(option.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full rounded px-2 py-2 text-left text-sm hover:bg-accent disabled:opacity-50",
                  value === option.value && "bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
