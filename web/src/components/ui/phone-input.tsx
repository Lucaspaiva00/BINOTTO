import { memo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COUNTRY_PHONES } from "@/utils/countries";

export interface PhoneValue {
  codigo_pais_telefone: string;
  numero_telefone: string;
  iso_pais_telefone: string;
}

interface PhoneInputProps {
  label?: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ISO = "BR";

const COUNTRY_OPTIONS = COUNTRY_PHONES.map((c) => (
  <SelectItem key={c.iso} value={c.iso}>
    <span className="flex items-center gap-2">
      <img src={c.flag} alt="" className="w-5 h-4 object-cover rounded-sm shrink-0" />
      <span className="truncate">{c.name}</span>
      <span className="text-muted-foreground">{c.code}</span>
    </span>
  </SelectItem>
));

function applyPhoneMask(rawDigits: string, mask: (string | RegExp)[] | null): string {
  if (!mask) return rawDigits;

  let result = "";
  let digitIndex = 0;

  for (const token of mask) {
    if (digitIndex >= rawDigits.length) break;

    if (typeof token === "string") {
      result += token;
      continue;
    }

    if (token.test(rawDigits[digitIndex])) {
      result += rawDigits[digitIndex];
    }
    digitIndex += 1;
  }

  return result;
}

function maxDigits(mask: (string | RegExp)[] | null): number {
  if (!mask) return Infinity;
  return mask.filter((token) => token instanceof RegExp).length;
}

export const PhoneInput = memo(function PhoneInput({
  label,
  value,
  onChange,
  error,
  className,
  disabled,
}: PhoneInputProps) {
  const country =
    COUNTRY_PHONES.find((c) => c.iso === value.iso_pais_telefone) ??
    COUNTRY_PHONES.find((c) => c.iso === DEFAULT_ISO) ??
    COUNTRY_PHONES[0];

  function handleCountryChange(iso: string) {
    const next = COUNTRY_PHONES.find((c) => c.iso === iso);
    if (!next) return;

    onChange({
      codigo_pais_telefone: next.code,
      numero_telefone: "",
      iso_pais_telefone: next.iso,
    });
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, maxDigits(country.mask));

    onChange({ ...value, numero_telefone: rawDigits });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div
        className={cn(
          "flex h-10 items-stretch rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        )}
      >
        <Select value={country.iso} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-auto shrink-0 gap-1 border-0 bg-transparent px-3 focus:ring-0 focus:ring-offset-0">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <img src={country.flag} alt="" className="w-5 h-4 object-cover rounded-sm shrink-0" />
                {country.code}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72" hideScrollButtons>
            {COUNTRY_OPTIONS}
          </SelectContent>
        </Select>

        <input
          type="text"
          value={applyPhoneMask(value.numero_telefone, country.mask)}
          onChange={handleNumberChange}
          placeholder={country.placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 border-0 border-l border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});
