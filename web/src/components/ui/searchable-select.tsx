import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  const [highlight, setHighlight] = useState(-1);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
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

  function close() {
    setOpen(false);
    setQuery("");
    setHighlight(-1);
  }

  function select(option: SearchableOption) {
    setSelectedLabel(option.label);
    onChange(option.value);
    close();
    trigger.current?.focus();
  }

  return (
    <div className={cn("relative", className)} onMouseLeave={close} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) close();
    }} onKeyDown={event => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
        trigger.current?.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
        const direction = event.key === "ArrowDown" ? 1 : -1;
        let next = highlight < 0 ? (direction > 0 ? 0 : filtered.length - 1) : highlight + direction;
        while (next >= 0 && next < filtered.length && filtered[next].disabled) next += direction;
        if (next >= 0 && next < filtered.length) {
          setHighlight(next);
          list.current?.children[next]?.scrollIntoView({ block: "nearest" });
        }
      } else if (event.key === "Enter" && open && highlight >= 0 && !filtered[highlight]?.disabled && filtered[highlight]) {
        event.preventDefault();
        select(filtered[highlight]);
      }
    }}>
      <button
        type="button"
        ref={trigger}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => open ? close() : setOpen(true)}
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
              onChange={(e) => { setQuery(e.target.value); setHighlight(-1); }}
              role="combobox" aria-expanded={true} aria-controls={listId}
              aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
              placeholder="Digite para pesquisar..."
              className="pl-8"
            />
          </div>
          <div ref={list} id={listId} role="listbox" className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum resultado.</p>
            ) : filtered.map((option, index) => (
              <button
                type="button"
                key={option.value}
                disabled={option.disabled}
                id={`${listId}-${index}`} role="option" aria-selected={option.value === value}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => select(option)}
                className={cn(
                  "w-full rounded px-2 py-2 text-left text-sm hover:bg-accent disabled:opacity-50",
                  (highlight === index || value === option.value) && "bg-accent",
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
